import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PublicClientApplication, EventType, AuthenticationResult } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./src/authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import ErrorBoundary from './components/common/ErrorBoundary';

const root = ReactDOM.createRoot(rootElement);

msalInstance.initialize().then(() => {
  // Account selection logic is a message to the user: you can select the account you want to use
  if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
  }

  msalInstance.addEventCallback((event) => {
    if ((event.eventType === EventType.LOGIN_SUCCESS ||
      event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
      event.eventType === EventType.SSO_SILENT_SUCCESS) && event.payload) {
      const payload = event.payload as AuthenticationResult;
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account);
      }
    }
  });

  // Handle the redirect promise to process the response from the login redirect
  msalInstance.handleRedirectPromise().then((authResult) => {
    // If we just returned from a redirect, authResult will be non-null.
    // The event callback above might also fire.
    if (authResult && authResult.account) {
      msalInstance.setActiveAccount(authResult.account);
    }

    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </MsalProvider>
      </React.StrictMode>
    );
  }).catch(err => {
    console.error("MSAL Handle Redirect Error:", err);
    // Render anyway so error boundary can catch or user sees something
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </MsalProvider>
      </React.StrictMode>
    );
  });
});
