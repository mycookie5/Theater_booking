import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Create the React root element
createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);