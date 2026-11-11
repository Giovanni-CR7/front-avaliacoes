import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App.jsx";
import "./index.css";

const domain =
  import.meta.env.VITE_AUTH0_DOMAIN?.trim() ||
  "dev-1vbhhb524hr3h5zd.us.auth0.com";

const clientId =
  import.meta.env.VITE_AUTH0_CLIENT_ID?.trim() ||
  "1EErawNITNj7bN6GLUMuMkMzvWOR2tRq";

const audience =
  import.meta.env.VITE_AUTH0_AUDIENCE?.trim() ||
  "https://api-avaliacoes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
        scope: "openid profile email",
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);