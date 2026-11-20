import { normalizeApiResult, type ApiResult } from '../utils/result';

export interface HttpRequestOptions {
  url: string;
  method: 'GET';
}

export interface HttpResponse {
  statusCode: number;
  data: unknown;
}

export type RequestTransport = (options: HttpRequestOptions) => Promise<HttpResponse>;
export type RequestClient = <T>(path: string) => Promise<ApiResult<T>>;

/** 传输层可注入；页面只拿到归一化后的结果，不接触状态码与原始响应。 */
export function createRequestClient(transport: RequestTransport, baseUrl: string): RequestClient {
  return async function request<T>(path: string): Promise<ApiResult<T>> {
    try {
      const response = await transport({ url: `${baseUrl}${path}`, method: 'GET' });
      return normalizeApiResult<T>(response.statusCode, response.data);
    } catch {
      return { kind: 'failure', message: '网络异常，请检查网络后重试' };
    }
  };
}
