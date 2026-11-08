/**
 * Lê e interpreta JSON de forma limitada para rotas server-side.
 * O limite é aplicado durante a leitura, inclusive quando Content-Length não existe.
 */
export type LimitedJsonResult = { ok: true; value: unknown } | { ok: false; response: Response };

export async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (
      !/^\d+$/.test(contentLength) ||
      !Number.isSafeInteger(declaredLength) ||
      declaredLength < 0
    ) {
      return {
        ok: false,
        response: new Response("Content-Length inválido", { status: 400 }),
      };
    }
    if (declaredLength > maxBytes) {
      return {
        ok: false,
        response: new Response("Solicitação muito grande", { status: 413 }),
      };
    }
  }

  if (!request.body) {
    return {
      ok: false,
      response: new Response("JSON inválido", { status: 400 }),
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        return {
          ok: false,
          response: new Response("Solicitação muito grande", { status: 413 }),
        };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) return null;

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      value: JSON.parse(new TextDecoder().decode(bytes)) as unknown,
    };
  } catch {
    return {
      ok: false,
      response: new Response("JSON inválido", { status: 400 }),
    };
  }
}

/**
 * Lê uma resposta externa sem permitir que o corpo exceda o limite de memória.
 * Retorna null para respostas sem corpo, Content-Length inválido ou corpo acima do limite.
 */
export async function readLimitedResponseBytes(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) return null;
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength > maxBytes) return null;
  }

  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
