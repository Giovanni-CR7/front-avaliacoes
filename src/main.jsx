import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";

// Domain e Client ID de uma SPA sao publicos (nao sao segredos).
// O AUDIENCE precisa ser IDENTICO ao "Identifier" da API no Auth0 (sem barra extra no final).
const domain = import.meta.env.VITE_AUTH0_DOMAIN ?? "dev-1vbhhb524hr3h5zd.us.auth0.com";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID ?? "1EErawNITNj7bN6GLUMuMkMzvWOR2tRq";
const audience = import.meta.env.VITE_AUTH0_AUDIENCE ?? "https://api-avaliacoes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);