# Autoliv Touch Screen (Web Application)

This is the Autoliv Touch Screen application, migrated to a 100% web-based architecture with Microsoft SSO Authentication.

## Features
- **Web Interface**: Accessible via any modern browser (Chrome/Edge).
- **Authentication**: Microsoft Entra ID (SSO) login.
- **Role Management**: Captures user info from Microsoft account.

## Run Locally

**Prerequisites:** Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configuration:**
    - Ensure `src/authConfig.ts` contains valid `clientId` and `authority` (Tenant ID).

3.  **Run the app:**
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    ```bash
    npm run build
    ```
    The output will be in `dist/`.

## Deployment
Deploy the `dist/` folder to any static hosting service (Vercel, Netlify, Azure Static Web Apps) or a local web server (IIS/Nginx).
