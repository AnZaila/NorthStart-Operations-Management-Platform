import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getAccessToken } from '@/utils/token'

function fileNameFromHeader(header: string | undefined, fallback: string) {
  if (!header) {
    return fallback
  }
  const utf = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf?.[1]) {
    return decodeURIComponent(utf[1])
  }
  const ascii = header.match(/filename="?([^"]+)"?/i)
  return ascii?.[1] || fallback
}

function cleanParams(params?: Record<string, unknown>) {
  if (!params) {
    return undefined
  }
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') {
      continue
    }
    next[key] = value
  }
  return next
}

async function blobError(data: Blob) {
  try {
    const text = await data.text()
    const json = JSON.parse(text) as { message?: string }
    return json.message || '导出失败'
  } catch {
    return '导出失败'
  }
}

export async function downloadFile(
  url: string,
  params?: Record<string, unknown>,
  fallbackName = 'download.xlsx',
) {
  try {
    const res = await axios.get(url, {
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      params: cleanParams(params),
      responseType: 'blob',
      timeout: 60000,
      headers: {
        Authorization: getAccessToken() ? `Bearer ${getAccessToken()}` : '',
      },
    })
    const type = String(res.headers['content-type'] || '')
    if (type.includes('application/json')) {
      throw new Error(await blobError(res.data))
    }
    const blob = new Blob([res.data])
    const name = fileNameFromHeader(res.headers['content-disposition'], fallbackName)
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = name
    link.click()
    URL.revokeObjectURL(href)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      throw new Error(await blobError(error.response.data))
    }
    throw error instanceof Error ? error : new Error('导出失败')
  }
}

export async function saveDownload(
  runner: () => Promise<void>,
  successText = '已开始下载',
) {
  try {
    await runner()
    ElMessage.success(successText)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败')
  }
}
