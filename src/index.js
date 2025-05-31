// src/index.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import App from './App';

// 0) Initialize Sentry before anything else
Sentry.init({
  dsn: 'https://62f9ecda2c906fb1d00d4407121f3525@o4509414110593024.ingest.de.sentry.io/4509414111772752',
  integrations: [
    new BrowserTracing({
      tracingOrigins: ['localhost', /^\//]
    })
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV,
  release: `project-portfolio@${process.env.npm_package_version}`
});

const container = document.getElementById('app');
if (!container) {
  console.error("❌ Cannot find #app container – check your HTML!");
} else {
  const root = createRoot(container);
  root.render(
    <Sentry.ErrorBoundary fallback={<div>Oops—something went wrong.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  );
}
