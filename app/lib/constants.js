const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export const api = async (path, opts = {}) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const url = API_BASE ? `${API_BASE}/api/${path}` : `/api/${path}`
    const res = await fetch(url, {
      headers,
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    })
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('fd_admin_user')
        window.dispatchEvent(new CustomEvent('fd:auth-expired'))
      }
      return { error: 'Session expired. Please log in again.' }
    }
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { error: 'Invalid server response' } }
  } catch (e) {
    console.error(`API error [${path}]:`, e.message)
    return { error: 'Network error. Please check your connection.' }
  }
}
