// Application resource limits, not Suno grammar or Styles prompt limits.
export const MAX_COMPILER_BODY_BYTES = 256 * 1024
export const MAX_RELATIONSHIP_NOTES_BYTES = 16 * 1024

export class CompilerRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function readCompilerRequest(request: Request): Promise<unknown> {
  // JSON plus an origin check prevents cookie-authenticated browser form/CSRF use.
  const origin = request.headers.get('origin')
  // Next's Request URL may use its internal hostname. Host is the actual browser
  // request authority; do not accept an arbitrary forwarded-host override.
  const url = new URL(request.url)
  const expectedOrigin = `${url.protocol}//${request.headers.get('host') ?? url.host}`
  if ((origin !== null && origin !== expectedOrigin)
    || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new CompilerRequestError(403, 'Cross-origin compiler requests are not allowed.')
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new CompilerRequestError(415, 'Submit musical intent as application/json.')
  }
  const tooLarge = () => new CompilerRequestError(413, 'The compiler request exceeds the application input limit.')
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null && Number(declaredLength) > MAX_COMPILER_BODY_BYTES) throw tooLarge()
  if (!request.body) throw new CompilerRequestError(400, 'Submit musical intent as JSON.')

  // Count actual streamed bytes; absent or dishonest Content-Length cannot bypass this.
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_COMPILER_BODY_BYTES) {
        void reader.cancel().catch(() => {})
        throw tooLarge()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
}
