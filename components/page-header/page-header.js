"use strict";
Component({
    properties: {
        title: {
            type: String,
            value: '',
        },
        showBack: {
            type: Boolean,
            value: false,
        },
        showHome: {
            type: Boolean,
            value: false,
        },
        showSearch: {
            type: Boolean,
            value: false,
        },
        showCaps: {
            type: Boolean,
            value: true,
        },
    },
    data: {
        statusBarHeight: 0,
    },
    lifetimes: {
        attached() {
            let height = 0;
            if (typeof wx !== 'undefined') {
                try {
                    height = wx.getSystemInfoSync().statusBarHeight || 0;
                }
                catch {
                    height = 0;
                }
            }
            this.setData({ statusBarHeight: height });
        },
    },
    methods: {
        onBack() {
            wx.navigateBack();
        },
        onHome() {
            wx.switchTab({ url: '/pages/index/index' });
        },
        onSearch() {
            this.triggerEvent('search');
        },
        onCaps() {
            this.triggerEvent('caps');
        },
    },
});
