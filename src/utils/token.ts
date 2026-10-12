const REFRESH_KEY = 'northstar.refreshToken'
const DEFAULT_ACCESS_TTL_SEC = 1800
const REFRESH_SKEW_MS = 90_000

let accessToken = ''
let accessExpiresAt = 0

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY) ?? ''
}

export function setTokens(access: string, refresh?: string, expiresIn?: number) {
  accessToken = access
  if (access) {
    const ttl = expiresIn && expiresIn > 0 ? expiresIn : DEFAULT_ACCESS_TTL_SEC
    accessExpiresAt = Date.now() + ttl * 1000
  } else {
    accessExpiresAt = 0
  }
  if (refresh !== undefined) {
    if (refresh) {
      sessionStorage.setItem(REFRESH_KEY, refresh)
    } else {
      sessionStorage.removeItem(REFRESH_KEY)
    }
  }
}

export function clearTokens() {
  accessToken = ''
  accessExpiresAt = 0
  sessionStorage.removeItem(REFRESH_KEY)
}

export function isAccessTokenFresh(skewMs = REFRESH_SKEW_MS) {
  return Boolean(accessToken) && accessExpiresAt - Date.now() > skewMs
}
