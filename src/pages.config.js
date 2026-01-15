import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import TimeOff from './pages/TimeOff';
import Expenses from './pages/Expenses';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Contracts from './pages/Contracts';
import Assets from './pages/Assets';
import Support from './pages/Support';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Employees": Employees,
    "TimeOff": TimeOff,
    "Expenses": Expenses,
    "Invoices": Invoices,
    "Vendors": Vendors,
    "Leads": Leads,
    "Pipeline": Pipeline,
    "Contracts": Contracts,
    "Assets": Assets,
    "Support": Support,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};