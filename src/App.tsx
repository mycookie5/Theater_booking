import { useLocation } from 'react-router-dom';
import Header from "./partials/Header";
import Main from './partials/Main';
import { useLoaderData } from "react-router-dom";
import { useState, useEffect } from 'react';

// turn off when not needed for debugging
const showBootstrapBreakpoints = true;

export default function App() {

  // scroll to top when the route changes
  useLocation();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  // get logged in user (also see loader in main.tsx)
  const [user, setUser] = useState();
  const userFromLoader = useLoaderData();

  useEffect(() => {
    setUser(userFromLoader);
  }, [userFromLoader]);

  // making the setter global so it can be used from
  // Login and Logout pages
  (globalThis as any).setUser = setUser;

  return !user ? null : <>
    <Header user={user} />
    <Main />
  </>;
};