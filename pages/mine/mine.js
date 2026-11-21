"use strict";
Page({
    data: {
        features: [
            { label: '我的地址', icon: '/assets/icons/line/map-pin.png' },
            { label: '我的订单', icon: '/assets/icons/line/clipboard.png' },
            { label: '充值中心', icon: '/assets/icons/line/card.png' },
            { label: '领券中心', icon: '/assets/icons/line/coupon.png' },
            { label: '签到中心', icon: '/assets/icons/line/calendar-check.png' },
            { label: '积分商城', icon: '/assets/icons/line/gift-box.png' },
            { label: '会员中心', icon: '/assets/icons/line/star.png' },
            { label: 'wifi', icon: '/assets/icons/line/wifi.png' },
            { label: '联系客服', icon: '/assets/icons/line/headset.png' },
        ],
    },
    onShow() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({ active: 2 });
        }
    },
    onUnavailable() {
        wx.showToast({ title: '暂未开放', icon: 'none' });
    },
});
