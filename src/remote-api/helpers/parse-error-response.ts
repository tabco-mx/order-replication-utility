export interface ErrorResponse {
  error?: { message?: string };
}

export async function parseErrorResponse(res: Response): Promise<{
  status: number;
  message: string;
}> {
  const body = (await res.json().catch(() => undefined)) as
    | ErrorResponse
    | undefined;

  const message = body?.error?.message ?? res.statusText;

  return {
    status: res.status,
    message,
  };
}
