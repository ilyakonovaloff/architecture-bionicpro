import React, { useEffect, useState } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { KeycloakConfig } from 'keycloak-js';
import { initKeycloakWithPKCE, KeycloakWithPKCE } from './utils/keycloakWithPKCE';
import ReportPage from './components/ReportPage';
import AuthCallback from './components/AuthCallback';

const keycloakConfig: KeycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: process.env.REACT_APP_KEYCLOAK_REALM||"",
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID||""
};

const App: React.FC = () => {
  const [keycloak, setKeycloak] = useState<KeycloakWithPKCE | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeKeycloak = async () => {
      try {
        console.log('App: Initializing Keycloak with PKCE...');
        console.log('App: Config:', keycloakConfig);
        const kc = await initKeycloakWithPKCE(keycloakConfig);
        console.log('App: Keycloak initialized successfully');
        console.log('App: Keycloak authenticated:', kc.authenticated);
        setKeycloak(kc);
      } catch (error) {
        console.error('App: Failed to initialize Keycloak with PKCE:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeKeycloak();
  }, []);

  // Check if we're on the callback route
  const isCallback = window.location.search.includes('code=') || window.location.search.includes('error=');
  console.log('App: isCallback:', isCallback);
  console.log('App: window.location.search:', window.location.search);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!keycloak) {
    return <div className="flex items-center justify-center min-h-screen">Failed to initialize authentication</div>;
  }

  // Render callback component if we're on callback route
  if (isCallback) {
    console.log('App: Rendering AuthCallback component');
    return (
      <ReactKeycloakProvider authClient={keycloak}>
        <AuthCallback />
      </ReactKeycloakProvider>
    );
  }

  console.log('App: Rendering main app with keycloak.authenticated:', keycloak.authenticated);
  
  // If not authenticated, show login page
  if (!keycloak.authenticated) {
    console.log('App: User not authenticated, showing login page');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Войти в систему
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Для доступа к отчетам необходимо авторизоваться
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <button
              onClick={() => keycloak.login()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Войти через Keycloak
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the main app
  console.log('App: User is authenticated, showing ReportPage');
  return (
    <ReactKeycloakProvider authClient={keycloak}>
      <div className="App">
        <ReportPage />
      </div>
    </ReactKeycloakProvider>
  );
};

export default App;