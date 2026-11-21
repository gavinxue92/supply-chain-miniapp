"use strict";
Page({
    data: {
        statusBarHeight: 0,
    },
    onLoad() {
        let statusBarHeight = 0;
        if (typeof wx !== 'undefined') {
            try {
                statusBarHeight = wx.getSystemInfoSync().statusBarHeight || 0;
            }
            catch {
                statusBarHeight = 0;
            }
        }
        this.setData({ statusBarHeight });
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ active: 0 });
        }
    },
    onUnavailable() {
        wx.showToast({ title: '暂未开放', icon: 'none' });
    },
});
