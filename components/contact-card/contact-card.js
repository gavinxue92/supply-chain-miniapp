"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contact_actions_1 = require("../../utils/contact-actions");
Component({
    properties: {
        contact: {
            type: Object,
            value: {},
        },
    },
    methods: {
        showFeedback(feedback) {
            wx.showToast({ title: feedback.message, icon: feedback.ok ? 'success' : 'none' });
        },
        async onCopyWechat(event) {
            this.showFeedback(await (0, contact_actions_1.copyContactValue)(event.currentTarget.dataset.value, '微信号'));
        },
        async onCopyPhone(event) {
            this.showFeedback(await (0, contact_actions_1.copyContactValue)(event.currentTarget.dataset.value, '手机号'));
        },
        async onDial(event) {
            this.showFeedback(await (0, contact_actions_1.dialContactPhone)(event.currentTarget.dataset.value));
        },
        onPreviewQr(event) {
            (0, contact_actions_1.previewContactQr)(event.currentTarget.dataset.url);
            wx.showToast({ title: '二维码已预览，长按可保存', icon: 'none' });
        },
        async onSaveQr(event) {
            this.showFeedback(await (0, contact_actions_1.saveContactQr)(event.currentTarget.dataset.url));
        },
    },
});
