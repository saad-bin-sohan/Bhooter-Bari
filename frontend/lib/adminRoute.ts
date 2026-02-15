const ADMIN_ROUTE_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/

const normalizeAdminRoutePrefix = (value: string | undefined) => {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('/')) {
    throw new Error('Invalid ADMIN_ROUTE_PREFIX. It must start with "/".')
  }
  const segment = trimmed.slice(1)
  if (!ADMIN_ROUTE_SEGMENT_PATTERN.test(segment)) {
    throw new Error('Invalid ADMIN_ROUTE_PREFIX. Use exactly one segment with letters, numbers, "_" or "-".')
  }
  return `/${segment}`
}

export const resolveAdminRoutePrefix = () => {
  const configured = normalizeAdminRoutePrefix(process.env.ADMIN_ROUTE_PREFIX)
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing ADMIN_ROUTE_PREFIX in production. Set a private path like /k9X2mTq4pR8.')
  }
  const fallbackSegment = 'admin'
  return `/${fallbackSegment}`
}

export const adminRouteSegmentFromPrefix = (prefix: string) => prefix.slice(1)
