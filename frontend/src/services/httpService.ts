export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions<TBody = any> {
  headers?: Record<string, string>;
  body?: TBody;
  cache?: RequestCache;
}

async function request<TResponse = any, TBody = any>(url: string, method: HttpMethod, options: RequestOptions<TBody> = {}): Promise<TResponse> {
  const { headers, body, cache } = options;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: cache ?? 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as TResponse;
}

export const HttpService = {
  get<T = any>(url: string, options?: Omit<RequestOptions, 'body'>) {
    return request<T>(url, 'GET', options);
  },
  post<T = any, B = any>(url: string, body?: B, options?: Omit<RequestOptions<B>, 'body'>) {
    return request<T, B>(url, 'POST', { ...(options || {}), body });
  },
  put<T = any, B = any>(url: string, body?: B, options?: Omit<RequestOptions<B>, 'body'>) {
    return request<T, B>(url, 'PUT', { ...(options || {}), body });
  },
  delete<T = any>(url: string, options?: Omit<RequestOptions, 'body'>) {
    return request<T>(url, 'DELETE', options);
  },
};

export default HttpService;

