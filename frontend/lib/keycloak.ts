import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL as string,
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM as string,
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID as string,
}

const initOptions = {
  onLoad: 'check-sso' as const,
  checkLoginIframe: false,
  flow: 'standard' as const,
  pkceMethod: 'S256' as const,
  // Use clean URL without hash fragments to prevent redirect loop
  redirectUri: typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}` 
    : undefined,
}

let keycloakInstance: Keycloak | null = null

export const getKeycloak = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig)
  }
  return keycloakInstance
}

export const initKeycloak = async (): Promise<boolean> => {
  const kc = getKeycloak()
  
  // Set up token refresh
  kc.onTokenExpired = () => {
    kc.updateToken(5).catch(() => {
      console.error('Failed to refresh token')
      kc.logout()
    })
  }
  
  try {
    const authenticated = await kc.init(initOptions)
    return authenticated
  } catch (err: any) {
    // login_required is not an error - it just means user needs to log in
    if (err?.error === 'login_required') {
      return false // Not authenticated, but not an error
    }
    console.error('Keycloak init failed:', err)
    return false
  }
}

export const login = () => {
  const kc = getKeycloak()
  kc.login()
}

export const logout = () => {
  const kc = getKeycloak()
  kc.logout()
}

export const isAuthenticated = (): boolean => {
  const kc = getKeycloak()
  return !!kc.authenticated
}

export const hasRole = (role: string): boolean => {
  const kc = getKeycloak()
  return kc.tokenParsed?.realm_access?.roles?.includes(role) || false
}

export const getUserInfo = () => {
  const kc = getKeycloak()
  if (!kc.tokenParsed) return null
  
  return {
    id: kc.tokenParsed.sub,
    email: kc.tokenParsed.email,
    name: kc.tokenParsed.name,
    username: kc.tokenParsed.preferred_username,
    roles: kc.tokenParsed.realm_access?.roles || [],
  }
}



