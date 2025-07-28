import React, { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { KeycloakWithPKCE } from '../utils/keycloakWithPKCE';

const AuthCallback: React.FC = () => {
  const { keycloak } = useKeycloak();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Starting callback handling');
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        console.log('AuthCallback: URL params:', { code: !!code, error });

        if (error) {
          console.error('AuthCallback: Authentication error:', error);
          setError(`Authentication error: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          console.error('AuthCallback: No authorization code received');
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        console.log('AuthCallback: Exchanging code for tokens...');
        // Exchange authorization code for tokens using PKCE
        const pkceKeycloak = keycloak as KeycloakWithPKCE;
        await pkceKeycloak.exchangeCode(code, window.location.origin);

        console.log('AuthCallback: Token exchange successful, updating authentication state...');
        
        // Force Keycloak to recognize as authenticated
        (keycloak as any).authenticated = true;
        
        // Clear URL parameters to avoid infinite loop
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        console.log('AuthCallback: Redirecting to main app...');
        // Use window.location.replace to avoid adding to history
        window.location.replace('/');
      } catch (err) {
        console.error('AuthCallback: PKCE callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [keycloak]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 