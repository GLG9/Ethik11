export function nanoid(size = 12): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const cryptoObj = (typeof globalThis !== 'undefined' && 'crypto' in globalThis && 'getRandomValues' in globalThis.crypto)
    ? globalThis.crypto
    : null;

  if (cryptoObj) {
    const array = new Uint32Array(size);
    cryptoObj.getRandomValues(array);
    for (let i = 0; i < size; i += 1) {
      id += alphabet[array[i] % alphabet.length];
    }
    return id;
  }

  for (let i = 0; i < size; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}
