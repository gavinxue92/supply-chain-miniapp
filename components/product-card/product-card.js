"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            if (product) {
                this.triggerEvent('select', { id: product.id });
            }
        },
    },
});
