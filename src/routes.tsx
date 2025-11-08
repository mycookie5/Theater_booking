import type Route from './interface/Route.tsx';
import { createElement } from 'react';

// page components
// general page
import NotFoundPage from './pages/NotFoundPage.tsx';
import Login from './auth/login.tsx';
import Register from './auth/register.tsx';
// import Home from './pages/Home.tsx';
// import About from './pages/About.tsx';
// import Contact from './pages/Contact.tsx';
// import Dashboard from './pages/Dashboard.tsx';

export default [
    NotFoundPage,
    Login,
    Register
]
    // map the route property of each page component to a Route
    .map(x => (({ element: createElement(x), ...x.route }) as Route))
    // sort by index (and if an item has no index, sort as index 0)
    .sort((a, b) => (a.index || 0) - (b.index || 0));