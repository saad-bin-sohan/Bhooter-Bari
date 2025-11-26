import { apiBase } from './config'

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type Options = {
  method?: Method
  body?: any
  token?: string
  headers?: Record<string, string>
  formData?: FormData
  credentials?: boolean
}

export const apiRequest = async <T>(path: string, opts: Options = {}) => {
  const url = `${apiBase}${path}`
  const headers: Record<string, string> = opts.formData ? {} : { 'Content-Type': 'application/json' }
  if (opts.headers) Object.assign(headers, opts.headers)
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.formData ? opts.formData : opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: opts.credentials ? 'include' : 'same-origin'
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.headers.get('content-type')?.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as T
}
