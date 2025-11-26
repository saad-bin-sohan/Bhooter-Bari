const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

const fromBase64 = (base64: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

const toBase64Url = (buffer: ArrayBuffer) => toBase64(buffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (value: string) => fromBase64(value.replace(/-/g, '+').replace(/_/g, '/'))

export const generateRoomKey = async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const raw = await crypto.subtle.exportKey('raw', key)
  return { key, encoded: toBase64Url(raw) }
}

export const importRoomKey = async (encoded: string) => {
  const raw = fromBase64Url(encoded)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export const encryptText = async (key: CryptoKey, text: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(text)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return { ciphertext: toBase64(cipher), iv: toBase64(iv.buffer) }
}

export const decryptText = async (key: CryptoKey, ciphertext: string, iv: string) => {
  const ivBuffer = fromBase64(iv)
  const data = fromBase64(ciphertext)
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuffer) }, key, data)
  return new TextDecoder().decode(plainBuffer)
}

export const encryptFile = async (key: CryptoKey, buffer: ArrayBuffer) => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer)
  return { ciphertext: cipher, iv: toBase64(iv.buffer) }
}

export const decryptFile = async (key: CryptoKey, ciphertext: ArrayBuffer, iv: string) => {
  const ivBuffer = fromBase64(iv)
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuffer) }, key, ciphertext)
}
