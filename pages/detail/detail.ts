import { catalogApi } from '../../api/catalog';
import { getApiBaseUrl } from '../../config/environment';
import { toProductDetailView, type ProductDetailView } from '../../utils/detail';
import { createLatestRequestGuard } from '../../utils/race';

type DetailState = 'loading' | 'ready' | 'notFound' | 'error';

interface DetailData {
  productId: number;
  state: DetailState;
  errorMessage: string;
  detail: ProductDetailView | null;
}

Page({
  requestGuard: createLatestRequestGuard(),

  data: {
    productId: 0,
    state: 'loading',
    errorMessage: '',
    detail: null,
  } as DetailData,

  onLoad(options: Record<string, string | undefined>) {
    this.setData({ productId: Number(options.id ?? 0) });
    void this.loadDetail();
  },

  async loadDetail(): Promise<void> {
    const token = this.requestGuard.begin();
    this.setData({ state: 'loading', errorMessage: '', detail: null });

    const result = await catalogApi.getProductDetail(this.data.productId);
    if (!this.requestGuard.isLatest(token)) {
      return;
    }

    if (result.kind === 'notFound' || result.kind === 'empty') {
      this.setData({ state: 'notFound', detail: null });
      return;
    }
    if (result.kind === 'failure') {
      this.setData({ state: 'error', errorMessage: result.message, detail: null });
      return;
    }
    this.setData({
      state: 'ready',
      detail: toProductDetailView(result.data, getApiBaseUrl()),
    });
  },

  onRetry(): void {
    void this.loadDetail();
  },

  onBack(): void {
    wx.navigateBack();
  },
});
