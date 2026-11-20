"use strict";
Page({
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ active: 0 });
        }
    },
    onUnavailable() {
        wx.showToast({ title: '暂未开放', icon: 'none' });
    },
});
