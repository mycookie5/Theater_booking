import { useLocation } from 'react-router-dom';
import Header from "./partials/Header";
import Main from './partials/Main';
import Footer from './partials/Footer';
import BootstrapBreakpoints from './parts/BootstrapBreakpoints';
import { useLoaderData } from "react-router-dom";
import { useState, useEffect } from 'react';

// turn off when not needed for debugging
const showBootstrapBreakpoints = true;

export default function App() {

  useLocation();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  const [user, setUser] = useState();
  const userFromLoader = useLoaderData();

  useEffect(() => {
    setUser(userFromLoader);
  }, [userFromLoader]);

  (globalThis as any).setUser = setUser;

  return !user ? null : <>
    <Header user={user} />
    <Main />
    <Footer />
    {showBootstrapBreakpoints ? <BootstrapBreakpoints /> : null}
  </>;
}