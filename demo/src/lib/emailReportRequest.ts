export function buildEmailReportRequest(
  method: 'GET' | 'PUT' | 'POST',
  fayAdminSessionToken: string,
  body?: unknown,
): RequestInit {
  return {
    method,
    headers: {
      'X-Fay-Admin-Session': fayAdminSessionToken,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }
}
