import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all active equity grants
    const grants = await base44.asServiceRole.entities.EquityGrant.filter({
      status: { $in: ['active', 'fully_vested'] }
    });

    const today = new Date();
    const updatedGrants = [];
    const vestingNotifications = [];

    for (const grant of grants) {
      if (!grant.vesting_start_date || !grant.vesting_period_months) {
        continue;
      }

      const vestingStartDate = new Date(grant.vesting_start_date);
      const cliffMonths = grant.cliff_months || 0;
      const vestingPeriodMonths = grant.vesting_period_months;
      const totalShares = grant.shares_granted || 0;

      // Calculate months elapsed since vesting start
      const monthsElapsed = Math.floor((today - vestingStartDate) / (1000 * 60 * 60 * 24 * 30.44));

      let vestedShares = 0;
      let newStatus = grant.status;

      // Check if cliff period has been met
      if (monthsElapsed >= cliffMonths) {
        // Calculate vested shares based on schedule
        if (grant.vesting_schedule === 'immediate') {
          vestedShares = totalShares;
          newStatus = 'fully_vested';
        } else if (grant.vesting_schedule === '4_year_1_cliff') {
          // After 1-year cliff, 25% vests, then monthly for remaining 36 months
          if (monthsElapsed >= 12) {
            const cliffVested = totalShares * 0.25;
            const monthlyVestAmount = (totalShares * 0.75) / 36;
            const monthsAfterCliff = Math.min(monthsElapsed - 12, 36);
            vestedShares = Math.floor(cliffVested + (monthlyVestAmount * monthsAfterCliff));
          }
        } else if (grant.vesting_schedule === '4_year_monthly') {
          // Monthly vesting over 48 months
          const monthlyVestAmount = totalShares / vestingPeriodMonths;
          const vestedMonths = Math.min(monthsElapsed, vestingPeriodMonths);
          vestedShares = Math.floor(monthlyVestAmount * vestedMonths);
        } else {
          // Default linear vesting
          const vestingProgress = Math.min(monthsElapsed / vestingPeriodMonths, 1);
          vestedShares = Math.floor(totalShares * vestingProgress);
        }

        // Check if fully vested
        if (vestedShares >= totalShares) {
          vestedShares = totalShares;
          newStatus = 'fully_vested';
        }
      }

      // Check for upcoming vesting milestones (within next 30 days)
      const daysUntilCliff = cliffMonths > 0 ? ((cliffMonths * 30.44) - (monthsElapsed * 30.44)) : 0;
      const daysUntilFullyVested = ((vestingPeriodMonths * 30.44) - (monthsElapsed * 30.44));

      // Notify about upcoming cliff
      if (daysUntilCliff > 0 && daysUntilCliff <= 30) {
        vestingNotifications.push({
          grant_id: grant.id,
          shareholder_id: grant.shareholder_id,
          shareholder_name: grant.shareholder_name,
          type: 'cliff_approaching',
          days_until: Math.ceil(daysUntilCliff),
          shares_to_vest: Math.floor(totalShares * 0.25),
        });
      }

      // Notify about upcoming full vesting
      if (daysUntilFullyVested > 0 && daysUntilFullyVested <= 30 && vestedShares < totalShares) {
        vestingNotifications.push({
          grant_id: grant.id,
          shareholder_id: grant.shareholder_id,
          shareholder_name: grant.shareholder_name,
          type: 'full_vesting_approaching',
          days_until: Math.ceil(daysUntilFullyVested),
          shares_to_vest: totalShares - vestedShares,
        });
      }

      // Update grant if vested shares changed
      if (vestedShares !== grant.shares_vested || newStatus !== grant.status) {
        await base44.asServiceRole.entities.EquityGrant.update(grant.id, {
          shares_vested: vestedShares,
          status: newStatus,
        });

        updatedGrants.push({
          grant_id: grant.id,
          shareholder_name: grant.shareholder_name,
          previous_vested: grant.shares_vested,
          new_vested: vestedShares,
          status: newStatus,
        });
      }
    }

    // Update shareholder totals
    const shareholders = await base44.asServiceRole.entities.Shareholder.list();
    
    for (const shareholder of shareholders) {
      const shareholderGrants = grants.filter(g => g.shareholder_id === shareholder.id);
      const totalVested = shareholderGrants.reduce((sum, g) => {
        const updatedGrant = updatedGrants.find(u => u.grant_id === g.id);
        return sum + (updatedGrant ? updatedGrant.new_vested : g.shares_vested || 0);
      }, 0);

      const totalShares = shareholderGrants.reduce((sum, g) => sum + (g.shares_granted || 0), 0);

      if (totalVested !== shareholder.shares_vested || totalShares !== shareholder.total_shares) {
        await base44.asServiceRole.entities.Shareholder.update(shareholder.id, {
          shares_vested: totalVested,
          shares_unvested: totalShares - totalVested,
          total_shares: totalShares,
        });
      }
    }

    // Send notifications for upcoming vesting events
    if (vestingNotifications.length > 0) {
      for (const notification of vestingNotifications) {
        const shareholder = shareholders.find(s => s.id === notification.shareholder_id);
        if (shareholder?.email) {
          const subject = notification.type === 'cliff_approaching' 
            ? 'Vesting Cliff Approaching'
            : 'Full Vesting Approaching';
          
          const body = notification.type === 'cliff_approaching'
            ? `Your equity grant cliff is approaching! In ${notification.days_until} days, ${notification.shares_to_vest.toLocaleString()} shares will vest.`
            : `Your equity grant is approaching full vesting! In ${notification.days_until} days, your remaining ${notification.shares_to_vest.toLocaleString()} shares will vest.`;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: shareholder.email,
            subject,
            body: `Hello ${shareholder.name},\n\n${body}\n\nYou can view your equity details in the Shareholder Portal.\n\nBest regards,\nYour Company`,
          });
        }
      }
    }

    return Response.json({
      success: true,
      updated_grants: updatedGrants.length,
      vesting_notifications: vestingNotifications.length,
      notifications: vestingNotifications,
    });

  } catch (error) {
    console.error('Vesting calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});