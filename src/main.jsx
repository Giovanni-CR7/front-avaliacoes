import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-1vbhhb524hr3h5zd.us.auth0.com"
      clientId="1EErawNITNj7bN6GLUMuMkMzvWOR2tRq"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://api-avaliacoes"
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);