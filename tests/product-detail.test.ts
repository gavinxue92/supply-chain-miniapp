import { describe, expect, it, vi } from 'vitest';
import { createCatalogApi } from '../api/catalog';
import { createRequestClient, type HttpRequestOptions, type HttpResponse } from '../api/request';
import type { PublicProductDetail } from '../types/catalog';
import { toProductDetailView } from '../utils/detail';

const baseUrl = 'http://localhost:8080';

const detail: PublicProductDetail = {
  id: 1001,
  name: '有机菠菜',
  categoryId: 11,
  mainImageUrl: '/api/v1/media/5001',
  galleryImageUrls: ['/api/v1/media/5002', '/api/v1/media/5003'],
  detailHtml: '<p>产地直供，当日采摘。</p><img src="/api/v1/media/5004" alt="实物图">',
  specifications: [
    { name: '500g/份', referencePrice: 12.3, priceDisplay: '¥12.30' },
    { name: '1kg/份', priceDisplay: '面议' },
  ],
  referencePriceNotice: '参考价仅供参考，实际价格以客服沟通为准',
  contact: {
    services: [
      { displayName: '采购咨询', wechatId: 'veg-buyer', qrImageUrl: '/api/v1/media/6001' },
      { displayName: '电话咨询', phone: '13800138000' },
    ],
  },
};

describe('产品详情映射', () => {
  it('主图、轮播和图文详情图片统一拼接环境基址', () => {
    const view = toProductDetailView(detail, baseUrl);

    expect(view.images).toEqual([
      'http://localhost:8080/api/v1/media/5001',
      'http://localhost:8080/api/v1/media/5002',
      'http://localhost:8080/api/v1/media/5003',
    ]);
    expect(view.detailHtml).toBe(
      '<p>产地直供，当日采摘。</p><img src="http://localhost:8080/api/v1/media/5004" alt="实物图">',
    );
  });

  it('规格逐条原样展示后端价格文案与参考价提示', () => {
    const view = toProductDetailView(detail, baseUrl);

    expect(view.specifications).toEqual([
      { name: '500g/份', priceDisplay: '¥12.30', isNegotiable: false },
      { name: '1kg/份', priceDisplay: '面议', isNegotiable: true },
    ]);
    expect(view.notice).toBe('参考价仅供参考，实际价格以客服沟通为准');
  });

  it('客服联系方式按后端顺序映射，缺省字段不伪造', () => {
    const view = toProductDetailView(detail, baseUrl);

    expect(view.contact?.services).toEqual([
      {
        displayName: '采购咨询',
        wechatId: 'veg-buyer',
        qrImageUrl: 'http://localhost:8080/api/v1/media/6001',
      },
      { displayName: '电话咨询', phone: '13800138000' },
    ]);
    expect(toProductDetailView({ ...detail, contact: undefined }, baseUrl).contact).toBeUndefined();
  });
});

describe('公开目录接口的产品详情', () => {
  it('按产品 ID 请求公开详情接口', async () => {
    const transport = vi.fn((_options: HttpRequestOptions) =>
      Promise.resolve({ statusCode: 200, data: { success: true, data: detail } } as HttpResponse),
    );
    const api = createCatalogApi(createRequestClient(transport, baseUrl));

    const result = await api.getProductDetail(1001);

    expect(transport).toHaveBeenCalledWith({ url: `${baseUrl}/api/v1/products/1001`, method: 'GET' });
    expect(result.kind).toBe('success');
  });

  it('404 与业务失败分别归一为不存在与失败', async () => {
    const notFoundTransport = vi.fn(() =>
      Promise.resolve({ statusCode: 404, data: { status: 404, message: 'Catalog resource not found' } } as HttpResponse),
    );
    const failureTransport = vi.fn(() =>
      Promise.resolve({ statusCode: 200, data: { success: false, message: 'bad request' } } as HttpResponse),
    );

    await expect(createCatalogApi(createRequestClient(notFoundTransport, baseUrl)).getProductDetail(999)).resolves.toEqual(
      { kind: 'notFound' },
    );
    await expect(
      createCatalogApi(createRequestClient(failureTransport, baseUrl)).getProductDetail(1001),
    ).resolves.toMatchObject({ kind: 'failure' });
  });
});
