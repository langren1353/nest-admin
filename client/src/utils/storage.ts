import jwtDecode from 'jwt-decode'

export enum AppStorageKey {
  TOKEN = 'token',
  REFRESH_TOKEN = 'refresh-token',
  REFRESH_TOKEN_EXP = 'rt-exp',
}

interface ItokenDecode {
  id?: string
  iat: number
  exp: number
}

/**
 * 存储 token 顺带存储 refreshToken
 * token 过期后，会自动根据 refreshToken 刷新 token
 * 如果 refreshToken 过期则必须重新登录
 * @param token
 * @param refreshToken
 */
export function setToken(token: string, refreshToken: string): void {
  localStorage.setItem(AppStorageKey.TOKEN, token)
  setRefreshToken(refreshToken)
  // 解析过期时间，设置过期
  const exp = (jwtDecode(refreshToken) as ItokenDecode)?.exp as number
  const rtExp = exp * 1000
  setRTExp(rtExp)
}

export function getToken(): string | null {
  return localStorage.getItem(AppStorageKey.TOKEN)
}

export function setRefreshToken(refreshToken: string): void {
  localStorage.setItem(AppStorageKey.REFRESH_TOKEN, refreshToken)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(AppStorageKey.REFRESH_TOKEN)
}

export function setRTExp(exp: number): void {
  localStorage.setItem(AppStorageKey.REFRESH_TOKEN_EXP, `${exp}`)
}
export function getRTExp(): number {
  const rtExpStr = localStorage.getItem(AppStorageKey.REFRESH_TOKEN_EXP)
  return rtExpStr ? Number(rtExpStr) : 0
}

export function clearAll() {
  localStorage.clear()
}
