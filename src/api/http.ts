import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { ApiError, type ApiResult } from '@/types/api'
import { clearTokens, getAccessToken, getRefreshToken, isAccessTokenFresh, setTokens } from '@/utils/token'
import { finishRequestProgress, startRequestProgress } from '@/utils/pageProgress'

const MODE = import.meta.env.VITE_API_MODE ?? 'http'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _progress?: boolean }

let refreshing: Promise<string> | null = null

function shouldTrackProgress(url?: string) {
  const path = String(url || '')
  return !path.includes('/ops/notifications') && !path.includes('/auth/captcha')
}

function beginProgress(config: RetryConfig) {
  if (!shouldTrackProgress(config.url) || config._progress) {
    return
  }
  config._progress = true
  startRequestProgress()
}

function endProgress(config?: RetryConfig) {
  if (!config?._progress) {
    return
  }
  config._progress = false
  finishRequestProgress()
}

http.interceptors.request.use(
  async (config) => {
    beginProgress(config as RetryConfig)
    if (!isAnonymousAuth(config.url)) {
      await ensureFreshAccessToken()
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    config.headers['Accept-Language'] = 'zh-CN'
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    endProgress(error?.config as RetryConfig | undefined)
    return Promise.reject(error)
  },
)

http.interceptors.response.use(
  (response) => {
    endProgress(response.config as RetryConfig)
    if (response.config.responseType === 'blob') {
      return response
    }
    const payload = response.data as ApiResult<unknown>
    if (payload && typeof payload.code === 'number' && payload.code !== 0) {
      throw new ApiError(payload.message || '请求失败', payload.code, response.status, payload.data, payload.requestId)
    }
    return payload?.data as never
  },
  async (error: AxiosError<ApiResult<unknown> | Blob>) => {
    endProgress(error.config as RetryConfig | undefined)
    const status = error.response?.status ?? 0
    let payload = error.response?.data
    if (payload instanceof Blob) {
      try {
        payload = JSON.parse(await payload.text()) as ApiResult<unknown>
      } catch {
        payload = undefined
      }
    }
    const config = error.config as RetryConfig | undefined
    const message = payload?.message || error.message || '网络异常'
    const code = payload?.code ?? status

    if (status === 401 && config && !config._retry && !isAnonymousAuth(config.url)) {
      config._retry = true
      try {
        const used = bearerOf(config.headers.Authorization)
        const current = getAccessToken()
        const next = current && current !== used ? current : await silentRefresh()
        config.headers.Authorization = `Bearer ${next}`
        return http(config)
      } catch {
        clearTokens()
        redirectLogin()
      }
    }

    const apiError = new ApiError(message, code, status, payload?.data, payload?.requestId)
    if (status !== 401) {
      ElMessage.error(apiError.message)
    }
    throw apiError
  },
)

function isAnonymousAuth(url?: string) {
  const path = String(url || '')
  return path.includes('/auth/login') || path.includes('/auth/refresh') || path.includes('/auth/captcha')
}

function bearerOf(value: unknown) {
  return String(value || '').replace(/^Bearer\s+/i, '')
}

async function ensureFreshAccessToken() {
  if (isAccessTokenFresh() || !getRefreshToken()) {
    return
  }
  try {
    await silentRefresh()
  } catch {
    clearTokens()
    redirectLogin()
    throw new ApiError('登录已过期', 40001, 401)
  }
}

async function silentRefresh() {
  if (!refreshing) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new ApiError('登录已过期', 40001, 401)
    }
    refreshing = axios
      .post<ApiResult<{ accessToken: string; refreshToken: string; expiresIn: number }>>(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh`,
        { refreshToken },
      )
      .then((res) => {
        const data = res.data.data
        setTokens(data.accessToken, data.refreshToken, data.expiresIn)
        return data.accessToken
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

function redirectLogin() {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `${import.meta.env.BASE_URL}login?redirect=${redirect}`.replace(/\/{2,}/g, '/')
  }
}

export function request<T>(config: AxiosRequestConfig) {
  return http.request<T, T>(config)
}

export async function requestBlob(path: string) {
  const res = (await http.get(path, {
    responseType: 'blob',
    timeout: 120000,
  })) as unknown as { data: Blob; status: number; headers: Record<string, string> }
  const blob = res.data
  const contentType = blob.type || String(res.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    const text = await blob.text()
    if (text.startsWith('{') || text.startsWith('[')) {
      const payload = JSON.parse(text) as ApiResult<unknown>
      const err = new ApiError(
        payload.message || '请求失败',
        payload.code,
        res.status,
        payload.data,
        payload.requestId,
      )
      ElMessage.error(err.message)
      throw err
    }
    return {
      blob: new Blob([text]),
      filename: parseContentDisposition(res.headers['content-disposition']),
      contentType,
    }
  }
  return {
    blob,
    filename: parseContentDisposition(res.headers['content-disposition']),
    contentType,
  }
}

function parseContentDisposition(header?: string) {
  const value = header || ''
  const utf = value.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1])
    } catch {
      return utf[1]
    }
  }
  const ascii = value.match(/filename="?([^";]+)"?/i)
  return ascii?.[1] || ''
}

export const isMock = MODE === 'mock'
