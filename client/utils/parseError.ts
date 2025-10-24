export type NormalizedError = {
  message: string;
  response?: any;
  original?: unknown;
};

/**
 * Safely parse an unknown thrown value into a normalized shape:
 * - message: string (best-effort)
 * - response: the axios-style response object if present (any)
 * - original: original thrown value for debugging
 */
export function parseError(err: unknown): NormalizedError {
  let message = 'An unknown error occurred';
  let response: any = undefined;

  if (err === undefined || err === null) {
    return { message, original: err };
  }

  // If it's an Error instance
  if (err instanceof Error) {
    message = err.message || err.toString();
    // try to access (err as any).response if present (some libs attach response to Error)
    response = (err as any).response ?? undefined;
    return { message, response, original: err };
  }

  // If it's a string
  if (typeof err === 'string') {
    message = err;
    return { message, original: err };
  }

  // If it's an object (AxiosError or custom object), try to extract message & response
  if (typeof err === 'object') {
    const anyErr = err as any;
    if (anyErr?.message && typeof anyErr.message === 'string') {
      message = anyErr.message;
    } else if (anyErr?.error && typeof anyErr.error === 'string') {
      message = anyErr.error;
    } else if (anyErr?.toString && typeof anyErr.toString === 'function') {
      try {
        const s = anyErr.toString();
        if (s && s !== '[object Object]') message = s;
      } catch {}
    }

    response = anyErr?.response ?? anyErr?.data ?? undefined;

    return { message, response, original: err };
  }

  // Fallback: stringify
  try {
    message = JSON.stringify(err);
  } catch {
    message = String(err);
  }

  return { message, original: err };
}

export default parseError;