import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import TimeOff from './pages/TimeOff';
import Expenses from './pages/Expenses';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Employees": Employees,
    "TimeOff": TimeOff,
    "Expenses": Expenses,
    "Invoices": Invoices,
    "Vendors": Vendors,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};