export interface ErrorBody {
  error?: { message?: string };
}

export async function parseErrorResponse(res: Response): Promise<Error> {
  const body = (await res.json().catch(() => undefined)) as
    | ErrorBody
    | undefined;
  const detail = body?.error?.message ?? res.statusText;
  return new Error(`Replicate ${res.status}: ${detail}`);
}
