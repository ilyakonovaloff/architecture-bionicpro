import Keycloak, { KeycloakConfig, KeycloakInitOptions, KeycloakLoginOptions } from 'keycloak-js';
import { setupPKCE, getAndRemoveCodeVerifier } from './pkce';

export class KeycloakWithPKCE extends Keycloak {
  constructor(config: KeycloakConfig) {
    super(config);
  }

  /**
   * Override login to include PKCE parameters
   */
  login(options?: KeycloakLoginOptions): any {
    return new Promise((resolve, reject) => {
      setupPKCE()
        .then(({ codeVerifier, codeChallenge }) => {
          const loginOptions = {
            ...options,
            action: 'login',
            scope: 'openid',
            responseType: 'code',
            codeChallenge,
            codeChallengeMethod: 'S256'
          };

          super.login(loginOptions)
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Override token exchange to include PKCE code verifier
   */
  async exchangeCode(code: string, redirectUri: string): Promise<void> {
    console.log('exchangeCode: Starting token exchange');
    const codeVerifier = getAndRemoveCodeVerifier();
    
    if (!codeVerifier) {
      console.error('exchangeCode: No PKCE code verifier found');
      throw new Error('No PKCE code verifier found. Please login again.');
    }

    console.log('exchangeCode: Code verifier found, preparing token request');
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId || '',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    const tokenUrl = `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    console.log('exchangeCode: Token URL:', tokenUrl);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    console.log('exchangeCode: Token response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('exchangeCode: Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    console.log('exchangeCode: Token exchange successful, updating Keycloak instance');
    
    // Update Keycloak instance with token data
    this.token = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.idToken = tokenData.id_token;
    (this as any).parsedToken = this.parseToken(tokenData.access_token);
    (this as any).parsedIdToken = this.parseToken(tokenData.id_token);
    
    // Set authenticated state
    this.authenticated = true;
    
    // Trigger token events
    if (this.onTokenExpired) {
      this.onTokenExpired = this.onTokenExpired.bind(this);
    }
    if (this.onAuthSuccess) {
      this.onAuthSuccess = this.onAuthSuccess.bind(this);
      this.onAuthSuccess();
    }
    
    console.log('exchangeCode: Keycloak instance updated successfully, authenticated:', this.authenticated);
  }

  /**
   * Parse JWT token
   */
  private parseToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  }
}

/**
 * Initialize Keycloak with PKCE support
 */
export async function initKeycloakWithPKCE(config: KeycloakConfig): Promise<KeycloakWithPKCE> {
  const keycloak = new KeycloakWithPKCE(config);
  
  const initOptions: KeycloakInitOptions = {
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256'
  };

  try {
    await keycloak.init(initOptions);
    return keycloak;
  } catch (error) {
    console.error('Keycloak initialization error:', error);
    throw error;
  }
} 