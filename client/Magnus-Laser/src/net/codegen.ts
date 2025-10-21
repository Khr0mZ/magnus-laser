const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function encodeRandomCode(len = 6) {
    const buf = new Uint8Array(len)
    const cryptoApi = globalThis.crypto
    if (!cryptoApi) {
        throw new Error('Web Crypto API is unavailable')
    }
    cryptoApi.getRandomValues(buf)
    return Array.from(buf, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
