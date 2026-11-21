interface ProductRowData {
  id: number;
  imageUrl: string;
  name: string;
  specSummary: string;
  priceDisplay: string;
  showCurrency: boolean;
}

Component({
  properties: {
    product: {
      type: Object,
      value: {},
    },
  },
  methods: {
    onTap() {
      const product = this.data.product as ProductRowData | null;
      if (product && product.id) {
        this.triggerEvent('select', { id: product.id });
      }
    },
  },
});
