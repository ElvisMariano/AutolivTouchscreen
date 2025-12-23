import { Configuration, PopupRequest } from "@azure/msal-browser";
const msalClientId = import.meta.env.VITE_MSAL_CLIENT_ID;
const msalAuthority = import.meta.env.VITE_MSAL_AUTHORITY;

if (!msalClientId || !msalAuthority) {
    throw new Error("Variáveis de ambiente MSAL não definidas: VITE_MSAL_CLIENT_ID e VITE_MSAL_AUTHORITY");
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
// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    // Escopos padrão para obter perfil e email.
    // Usaremos o ID TOKEN para autenticar no backend, pois ele possui audience = client_id
    scopes: ["User.Read", "openid", "profile", "email"]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
