/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import AppLinks from './pages/AppLinks';
import Assets from './pages/Assets';
import Benefits from './pages/Benefits';
import CapTable from './pages/CapTable';
import CareerPathing from './pages/CareerPathing';
import Claims from './pages/Claims';
import CompanySkills from './pages/CompanySkills';
import Compliance from './pages/Compliance';
import ComplianceTraining from './pages/ComplianceTraining';
import Contracts from './pages/Contracts';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import DirectDeposit from './pages/DirectDeposit';
import Documents from './pages/Documents';
import EmailTemplates from './pages/EmailTemplates';
import EmployeePortal from './pages/EmployeePortal';
import Employees from './pages/Employees';
import EquityManagement from './pages/EquityManagement';
import Expenses from './pages/Expenses';
import HRContracts from './pages/HRContracts';
import Hiring from './pages/Hiring';
import InternshipProgram from './pages/InternshipProgram';
import Invoices from './pages/Invoices';
import MentorshipProgram from './pages/MentorshipProgram';
import NDAs from './pages/NDAs';
import Offboarding from './pages/Offboarding';
import Onboarding from './pages/Onboarding';
import OpenEnrollment from './pages/OpenEnrollment';
import OrgChart from './pages/OrgChart';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Recognition from './pages/Recognition';
import Settings from './pages/Settings';
import ShareholderPortal from './pages/ShareholderPortal';
import Support from './pages/Support';
import Surveys from './pages/Surveys';
import TaxDocuments from './pages/TaxDocuments';
import TimeOff from './pages/TimeOff';
import Training from './pages/Training';
import Vendors from './pages/Vendors';
import WelcomePackets from './pages/WelcomePackets';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Analytics": Analytics,
    "Announcements": Announcements,
    "AppLinks": AppLinks,
    "Assets": Assets,
    "Benefits": Benefits,
    "CapTable": CapTable,
    "CareerPathing": CareerPathing,
    "Claims": Claims,
    "CompanySkills": CompanySkills,
    "Compliance": Compliance,
    "ComplianceTraining": ComplianceTraining,
    "Contracts": Contracts,
    "Dashboard": Dashboard,
    "Departments": Departments,
    "DirectDeposit": DirectDeposit,
    "Documents": Documents,
    "EmailTemplates": EmailTemplates,
    "EmployeePortal": EmployeePortal,
    "Employees": Employees,
    "EquityManagement": EquityManagement,
    "Expenses": Expenses,
    "HRContracts": HRContracts,
    "Hiring": Hiring,
    "InternshipProgram": InternshipProgram,
    "Invoices": Invoices,
    "MentorshipProgram": MentorshipProgram,
    "NDAs": NDAs,
    "Offboarding": Offboarding,
    "Onboarding": Onboarding,
    "OpenEnrollment": OpenEnrollment,
    "OrgChart": OrgChart,
    "Payroll": Payroll,
    "Performance": Performance,
    "Recognition": Recognition,
    "Settings": Settings,
    "ShareholderPortal": ShareholderPortal,
    "Support": Support,
    "Surveys": Surveys,
    "TaxDocuments": TaxDocuments,
    "TimeOff": TimeOff,
    "Training": Training,
    "Vendors": Vendors,
    "WelcomePackets": WelcomePackets,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};