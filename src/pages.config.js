import Assets from './pages/Assets';
import Contracts from './pages/Contracts';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import HRContracts from './pages/HRContracts';
import Invoices from './pages/Invoices';
import Leads from './pages/Leads';
import Onboarding from './pages/Onboarding';
import Pipeline from './pages/Pipeline';
import Support from './pages/Support';
import TimeOff from './pages/TimeOff';
import Vendors from './pages/Vendors';
import WelcomePackets from './pages/WelcomePackets';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assets": Assets,
    "Contracts": Contracts,
    "Dashboard": Dashboard,
    "Employees": Employees,
    "Expenses": Expenses,
    "HRContracts": HRContracts,
    "Invoices": Invoices,
    "Leads": Leads,
    "Onboarding": Onboarding,
    "Pipeline": Pipeline,
    "Support": Support,
    "TimeOff": TimeOff,
    "Vendors": Vendors,
    "WelcomePackets": WelcomePackets,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};