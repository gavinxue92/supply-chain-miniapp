import type { ProductCardData } from '../../utils/product';

Component({
  properties: {
    product: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onTap() {
      const product = this.data.product as ProductCardData | null;
      if (product) {
        this.triggerEvent('select', { id: product.id });
      }
    },
  },
});
