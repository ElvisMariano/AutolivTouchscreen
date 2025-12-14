import { Configuration, PopupRequest } from "@azure/msal-browser";
const msalClientId = process.env.MSAL_CLIENT_ID;
const msalAuthority = process.env.MSAL_AUTHORITY;
if (!msalClientId || !msalAuthority) {
    throw new Error("Variáveis de ambiente MSAL não definidas: MSAL_CLIENT_ID e MSAL_AUTHORITY");
}
export const msalConfig: Configuration = {
    auth: {
        clientId: msalClientId,
        authority: msalAuthority,
        redirectUri: "/",
        postLogoutRedirectUri: "/"
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: ["User.Read"]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
