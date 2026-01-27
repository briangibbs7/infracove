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
import Onboarding from './pages/Onboarding';
import Performance from './pages/Performance';
import Support from './pages/Support';
import TimeOff from './pages/TimeOff';
import Training from './pages/Training';
import Vendors from './pages/Vendors';
import WelcomePackets from './pages/WelcomePackets';
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
    "Onboarding": Onboarding,
    "Performance": Performance,
    "Support": Support,
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