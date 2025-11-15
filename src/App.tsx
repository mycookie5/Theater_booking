import { useLocation } from 'react-router-dom';
import Header from "./partials/Header";
import Main from './partials/Main';
import { useLoaderData } from "react-router-dom";
import { useState, useEffect } from 'react';

export default function App() {

  useLocation();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  const [user, setUser] = useState();
  const userFromLoader = useLoaderData();

  useEffect(() => {
    setUser(userFromLoader);
  }, [userFromLoader]);

  (globalThis as any).setUser = setUser;

  console.log('App render, user=', user);
  return !user ? null : <>
    <Header user={user} />
    <Main />
  </>;
};