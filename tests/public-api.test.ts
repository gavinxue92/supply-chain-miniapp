import { describe, expect, it, vi } from 'vitest';
import { createRequestClient, type HttpRequestOptions, type HttpResponse, type RequestClient } from '../api/request';
import { createCatalogApi, PREVIEW_CATEGORY_LIMIT, PREVIEW_PRODUCT_LIMIT } from '../api/catalog';
import type { ApiResult } from '../utils/result';
import type { PublicCategory, PublicProductSummary } from '../types/catalog';

const baseUrl = 'http://localhost:8080';

function summary(id: number): PublicProductSummary {
  return {
    id,
    name: `产品 ${id}`,
    categoryId: 11,
    mainImageUrl: `/api/v1/media/${5000 + id}`,
    specifications: [{ name: '500g/份', priceDisplay: '¥12.30' }],
    referencePriceNotice: '参考价仅供参考，实际价格以客服沟通为准',
  };
}

function transportReturning(response: HttpResponse): (options: HttpRequestOptions) => Promise<HttpResponse> {
  return () => Promise.resolve(response);
}

function fakeRequestClient(handler: (path: string) => ApiResult<unknown>) {
  const spy = vi.fn((path: string) => Promise.resolve(handler(path)));
  return { request: spy as unknown as RequestClient, spy };
}

describe('公开目录接口请求', () => {
  it('成功响应同时满足 HTTP 状态与 success 时返回结构化数据', async () => {
    const data = [{ id: 1, name: '新鲜蔬菜', sortOrder: 10, children: [] }];
    const request = createRequestClient(
      transportReturning({ statusCode: 200, data: { success: true, data } }),
      baseUrl,
    );

    await expect(request<PublicCategory[]>('/api/v1/categories')).resolves.toEqual({ kind: 'success', data });
  });

  it('空数组是正常空数据而不是错误', async () => {
    const request = createRequestClient(
      transportReturning({ statusCode: 200, data: { success: true, data: [] } }),
      baseUrl,
    );

    await expect(request<PublicProductSummary[]>('/api/v1/categories/11/products')).resolves.toEqual({ kind: 'empty' });
  });

  it('HTTP 成功但 success 为 false 时返回失败结果', async () => {
    const request = createRequestClient(
      transportReturning({ statusCode: 200, data: { success: false, message: 'bad request' } }),
      baseUrl,
    );

    await expect(request('/api/v1/categories')).resolves.toMatchObject({ kind: 'failure' });
  });

  it('404 与空数据区分处理', async () => {
    const request = createRequestClient(
      transportReturning({ statusCode: 404, data: { status: 404, message: 'Catalog resource not found' } }),
      baseUrl,
    );

    await expect(request('/api/v1/products/999')).resolves.toEqual({ kind: 'notFound' });
  });

  it('网络异常归一化为可处理的失败结果', async () => {
    const transport = vi.fn(() => Promise.reject(new Error('network down')));
    const request = createRequestClient(transport, baseUrl);

    await expect(request('/api/v1/categories')).resolves.toMatchObject({ kind: 'failure' });
  });

  it('请求地址由当前环境基址与公开接口路径拼接', async () => {
    const transport = vi.fn(transportReturning({ statusCode: 200, data: { success: true, data: [] } }));
    const request = createRequestClient(transport, baseUrl);

    await request('/api/v1/categories');
    expect(transport).toHaveBeenCalledWith({ url: `${baseUrl}/api/v1/categories`, method: 'GET' });
  });
});

describe('公开目录接口封装', () => {
  it('分类树与分类产品分别请求约定的公开路径', async () => {
    const { request, spy } = fakeRequestClient(() => ({ kind: 'success', data: [] }));
    const api = createCatalogApi(request);

    await api.getCategoryTree();
    await api.getCategoryProducts(11);
    expect(spy.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/categories',
      '/api/v1/categories/11/products',
    ]);
  });

  it('分类产品预览按分类树顺序合并前几个分类的产品', async () => {
    const { request, spy } = fakeRequestClient((path) => {
      if (path === '/api/v1/categories/1/products') return { kind: 'success', data: [summary(1001)] };
      if (path === '/api/v1/categories/2/products') return { kind: 'success', data: [summary(1002)] };
      return { kind: 'success', data: [summary(1003)] };
    });
    const api = createCatalogApi(request);

    const result = await api.getCategoryPreview([1, 2, 3, 4, 5, 6]);

    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.data.map((item) => item.id)).toEqual([1001, 1002, 1003]);
    expect(spy).toHaveBeenCalledTimes(PREVIEW_CATEGORY_LIMIT);
    expect(result.data.length).toBeLessThanOrEqual(PREVIEW_PRODUCT_LIMIT);
  });

  it('公开目录接口的搜索调用不传分类筛选参数', async () => {
    const { request, spy } = fakeRequestClient(() => ({ kind: 'success', data: [summary(1002), summary(1001)] }));
    const api = createCatalogApi(request);

    const result = await api.searchProducts('牛腩');

    expect(spy).toHaveBeenCalledWith(`/api/v1/products/search?q=${encodeURIComponent('牛腩')}`);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.kind).toBe('success');
    if (result.kind !== 'success') return;
    expect(result.data.map((item) => item.id)).toEqual([1002, 1001]);
  });

  it('预览请求全部失败时返回失败结果', async () => {
    const { request } = fakeRequestClient(() => ({ kind: 'failure', message: '请求失败' }));
    const api = createCatalogApi(request);

    await expect(api.getCategoryPreview([1, 2])).resolves.toMatchObject({ kind: 'failure' });
  });

  it('部分分类为空且其余请求失败时返回失败结果以便重试', async () => {
    const { request } = fakeRequestClient((path) =>
      path === '/api/v1/categories/1/products'
        ? { kind: 'empty' }
        : { kind: 'failure', message: '请求失败' },
    );
    const api = createCatalogApi(request);

    await expect(api.getCategoryPreview([1, 2])).resolves.toMatchObject({ kind: 'failure' });
  });
});
