import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import TimeOff from './pages/TimeOff';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Employees": Employees,
    "TimeOff": TimeOff,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};