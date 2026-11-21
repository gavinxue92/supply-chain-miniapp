"use strict";
Component({
    properties: {
        product: {
            type: Object,
            value: {},
        },
    },
    methods: {
        onTap() {
            const product = this.data.product;
            if (product && product.id) {
                this.triggerEvent('select', { id: product.id });
            }
        },
    },
});
