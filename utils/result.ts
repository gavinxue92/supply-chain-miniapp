import type { ResultEnvelope } from '../types/result';

/** 页面可处理的四种请求结果：成功、空数据、不存在、失败。 */
export type ApiResult<T> =
  | { kind: 'success'; data: T }
  | { kind: 'empty' }
  | { kind: 'notFound' }
  | { kind: 'failure'; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEnvelope(value: unknown): value is ResultEnvelope<unknown> {
  return isRecord(value) && typeof value.success === 'boolean';
}

/** 必须同时判断 HTTP 状态码与 success；404 表示资源不存在而不是空列表。 */
export function normalizeApiResult<T>(statusCode: number, body: unknown): ApiResult<T> {
  if (statusCode === 404) {
    return { kind: 'notFound' };
  }
  if (statusCode < 200 || statusCode >= 300) {
    return { kind: 'failure', message: '服务暂时不可用，请稍后重试' };
  }
  if (!isEnvelope(body) || body.success !== true) {
    return { kind: 'failure', message: '加载失败，请稍后重试' };
  }
  if (body.data === undefined || body.data === null) {
    return { kind: 'empty' };
  }
  if (Array.isArray(body.data) && body.data.length === 0) {
    return { kind: 'empty' };
  }
  return { kind: 'success', data: body.data as T };
}
