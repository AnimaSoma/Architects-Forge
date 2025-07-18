import React from 'react';
import { createRoot } from 'react-dom/client';
import ISRMFoundationLanding from './ISRMFoundationLanding.jsx';
import CustomCursor from './CustomCursor.jsx';
import './index.css';

// Mount the root React component into #root div defined in index.html
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <>
      <CustomCursor />
      <ISRMFoundationLanding />
    </>
  </React.StrictMode>
);
