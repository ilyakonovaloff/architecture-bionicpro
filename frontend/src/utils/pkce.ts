// PKCE utilities for OAuth 2.0 Authorization Code Flow with PKCE

/**
 * Generates a random string for PKCE code verifier
 */
export function generateCodeVerifier(length: number = 128): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += charset.charAt(randomValues[i] % charset.length);
  }
  
  return result;
}

/**
 * Generates PKCE code challenge from code verifier using SHA256
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Stores PKCE code verifier in session storage
 */
export function storeCodeVerifier(codeVerifier: string): void {
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
}

/**
 * Retrieves and removes PKCE code verifier from session storage
 */
export function getAndRemoveCodeVerifier(): string | null {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (codeVerifier) {
    sessionStorage.removeItem('pkce_code_verifier');
  }
  return codeVerifier;
}

/**
 * Complete PKCE flow setup - generates verifier and challenge
 */
export async function setupPKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  storeCodeVerifier(codeVerifier);
  
  return { codeVerifier, codeChallenge };
} 