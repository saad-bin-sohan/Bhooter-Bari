export const toNonNegativeWholeSecondsFromMs = (ms: number): number => {
  if (!Number.isFinite(ms)) return 0
  return Math.max(0, Math.floor(ms / 1000))
}

export const toNonNegativeBigIntFromSeconds = (seconds: number): bigint => {
  if (!Number.isFinite(seconds)) return 0n
  return BigInt(Math.max(0, Math.floor(seconds)))
}

export const parseOptionalPositiveSeconds = (raw: unknown): number | null => {
  if (raw === undefined || raw === null) return null
  if (typeof raw === 'string' && raw.trim() === '') return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  const wholeSeconds = Math.floor(parsed)
  if (wholeSeconds <= 0) return null
  return wholeSeconds
}
