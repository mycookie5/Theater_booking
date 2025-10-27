import type { JSX } from "react";
import Booking from "./pages/booking";
import Events from "./pages/events";
import Home from "./pages/home";
import Mytickets from "./pages/mytickets";


interface Route {
    element: JSX.Element;
    path: string;
    menuLabel?: string;
}

const routes: Route[] = [
    { element: <Home />, path: '', menuLabel: 'Home' },
    { element: <Booking />, path: '/booking', menuLabel: 'Booking' },
    { element: <Events />, path: '/events', menuLabel: 'Events' },
    { element: <Mytickets />, path: '/mytickets', menuLabel: 'My Tickets' }
];

export default routes;