import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import * as Sentry from "@sentry/react";

// Initialize Sentry
Sentry.init({
  // IMPORTANT: Replace this with your ACTUAL Sentry DSN from your Sentry project settings!
  // Make sure this is correct, or you will get 403 Forbidden errors.
  dsn: "https://62f9ecda2c906fb1d00d4407121f3525@o4509414110593024.ingest.de.sentry.io/4509414111772752", 
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Optional: Mask all text content for privacy
      maskAllText: true,
      // Optional: Block all media (images, SVGs, etc.) for privacy
      blockAllMedia: true,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions. Adjust for production.
  // Session Replay
  replaysSessionSampleRate: 0.1, // This percentage of sessions will be recorded.
                                 // Adjust for production or set to 0 if not needed.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, 
                                 // sample the session when an error occurs.
});

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Fatal Error: The root element with ID 'root' was not found in the HTML. React application cannot be mounted.");
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. 
// Sentry's BrowserTracing integration often handles web vitals automatically.
reportWebVitals(console.log);