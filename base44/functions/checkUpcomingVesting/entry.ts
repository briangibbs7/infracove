import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is meant to be called by a scheduled automation
    // It checks for upcoming vesting events and creates notifications

    const equityGrants = await base44.asServiceRole.entities.EquityGrant.list();
    const shareholders = await base44.asServiceRole.entities.Shareholder.list();
    const notifications = await base44.asServiceRole.entities.Notification.list();

    const today = new Date();
    const upcomingDays = 30; // Check for vesting events in the next 30 days

    const vestingEvents = [];

    equityGrants.forEach(grant => {
      if (!grant.vesting_start_date || grant.status === "fully_vested" || grant.status === "cancelled") {
        return;
      }

      const startDate = new Date(grant.vesting_start_date || grant.grant_date);
      const {
        vesting_period_months = 48,
        cliff_months = 12,
        shares_granted,
        vesting_schedule
      } = grant;

      if (vesting_schedule === "immediate") return;

      // Check cliff date
      const cliffDate = new Date(startDate);
      cliffDate.setMonth(cliffDate.getMonth() + cliff_months);
      
      const daysUntilCliff = Math.ceil((cliffDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilCliff > 0 && daysUntilCliff <= upcomingDays) {
        const cliffShares = Math.floor((cliff_months / vesting_period_months) * shares_granted);
        vestingEvents.push({
          grant_id: grant.id,
          shareholder_id: grant.shareholder_id,
          shareholder_name: grant.shareholder_name,
          type: "cliff",
          date: cliffDate,
          shares: cliffShares,
          daysUntil: daysUntilCliff
        });
      }

      // Check full vesting date
      const fullVestingDate = new Date(startDate);
      fullVestingDate.setMonth(fullVestingDate.getMonth() + vesting_period_months);
      
      const daysUntilFull = Math.ceil((fullVestingDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilFull > 0 && daysUntilFull <= upcomingDays) {
        vestingEvents.push({
          grant_id: grant.id,
          shareholder_id: grant.shareholder_id,
          shareholder_name: grant.shareholder_name,
          type: "full_vesting",
          date: fullVestingDate,
          shares: shares_granted,
          daysUntil: daysUntilFull
        });
      }

      // Check for monthly vesting milestones (6 month intervals)
      if (vesting_schedule === "4_year_monthly" || vesting_schedule === "custom") {
        for (let months = cliff_months + 6; months < vesting_period_months; months += 6) {
          const milestoneDate = new Date(startDate);
          milestoneDate.setMonth(milestoneDate.getMonth() + months);
          
          const daysUntilMilestone = Math.ceil((milestoneDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilMilestone > 0 && daysUntilMilestone <= upcomingDays) {
            const cumulativeShares = Math.floor((months / vesting_period_months) * shares_granted);
            vestingEvents.push({
              grant_id: grant.id,
              shareholder_id: grant.shareholder_id,
              shareholder_name: grant.shareholder_name,
              type: "milestone",
              date: milestoneDate,
              shares: cumulativeShares,
              daysUntil: daysUntilMilestone,
              milestone: `${months} months`
            });
          }
        }
      }
    });

    // Create notifications for events
    const createdNotifications = [];
    
    for (const event of vestingEvents) {
      const shareholder = shareholders.find(s => s.id === event.shareholder_id);
      if (!shareholder?.email) continue;

      // Check if notification already exists
      const existingNotification = notifications.find(n => 
        n.type === "vesting_event" &&
        n.related_id === event.grant_id &&
        n.date === event.date.toISOString().split('T')[0]
      );

      if (existingNotification) continue;

      let title, message;
      
      if (event.type === "cliff") {
        title = "🎉 Vesting Cliff Approaching";
        message = `Your vesting cliff is ${event.daysUntil} days away! ${event.shares.toLocaleString()} shares will vest on ${event.date.toLocaleDateString()}.`;
      } else if (event.type === "full_vesting") {
        title = "✅ Full Vesting Date Approaching";
        message = `Your equity grant will be fully vested in ${event.daysUntil} days on ${event.date.toLocaleDateString()}.`;
      } else {
        title = "📈 Vesting Milestone Approaching";
        message = `You'll reach your ${event.milestone} vesting milestone in ${event.daysUntil} days. ${event.shares.toLocaleString()} shares cumulative.`;
      }

      const notification = await base44.asServiceRole.entities.Notification.create({
        user_email: shareholder.email,
        title,
        message,
        type: "vesting_event",
        related_id: event.grant_id,
        date: event.date.toISOString().split('T')[0],
        is_read: false,
        priority: event.type === "cliff" ? "high" : "normal"
      });

      createdNotifications.push(notification);
    }

    return Response.json({
      success: true,
      events_found: vestingEvents.length,
      notifications_created: createdNotifications.length,
      events: vestingEvents
    });

  } catch (error) {
    console.error("Error checking vesting events:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});