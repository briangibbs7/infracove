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
import Analytics from './pages/Analytics';
import Announcements from './pages/Announcements';
import Assets from './pages/Assets';
import CareerPathing from './pages/CareerPathing';
import Contracts from './pages/Contracts';
import Dashboard from './pages/Dashboard';
import EmployeePortal from './pages/EmployeePortal';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import HRContracts from './pages/HRContracts';
import Invoices from './pages/Invoices';
import NDAs from './pages/NDAs';
import Offboarding from './pages/Offboarding';
import Onboarding from './pages/Onboarding';
import Performance from './pages/Performance';
import Support from './pages/Support';
import TimeOff from './pages/TimeOff';
import Training from './pages/Training';
import Vendors from './pages/Vendors';
import WelcomePackets from './pages/WelcomePackets';
import MentorshipProgram from './pages/MentorshipProgram';
import InternshipProgram from './pages/InternshipProgram';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Announcements": Announcements,
    "Assets": Assets,
    "CareerPathing": CareerPathing,
    "Contracts": Contracts,
    "Dashboard": Dashboard,
    "EmployeePortal": EmployeePortal,
    "Employees": Employees,
    "Expenses": Expenses,
    "HRContracts": HRContracts,
    "Invoices": Invoices,
    "NDAs": NDAs,
    "Offboarding": Offboarding,
    "Onboarding": Onboarding,
    "Performance": Performance,
    "Support": Support,
    "TimeOff": TimeOff,
    "Training": Training,
    "Vendors": Vendors,
    "WelcomePackets": WelcomePackets,
    "MentorshipProgram": MentorshipProgram,
    "InternshipProgram": InternshipProgram,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};