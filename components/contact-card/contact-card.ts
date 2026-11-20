import {
  copyContactValue,
  dialContactPhone,
  previewContactQr,
  saveContactQr,
  type ContactActionFeedback,
} from '../../utils/contact-actions';

Component({
  properties: {
    contact: {
      type: Object,
      value: {},
    },
  },
  methods: {
    showFeedback(feedback: ContactActionFeedback) {
      wx.showToast({ title: feedback.message, icon: feedback.ok ? 'success' : 'none' });
    },
    async onCopyWechat(event: { currentTarget: { dataset: { value: string } } }): Promise<void> {
      this.showFeedback(await copyContactValue(event.currentTarget.dataset.value, '微信号'));
    },
    async onCopyPhone(event: { currentTarget: { dataset: { value: string } } }): Promise<void> {
      this.showFeedback(await copyContactValue(event.currentTarget.dataset.value, '手机号'));
    },
    async onDial(event: { currentTarget: { dataset: { value: string } } }): Promise<void> {
      this.showFeedback(await dialContactPhone(event.currentTarget.dataset.value));
    },
    onPreviewQr(event: { currentTarget: { dataset: { url: string } } }): void {
      previewContactQr(event.currentTarget.dataset.url);
      wx.showToast({ title: '二维码已预览，长按可保存', icon: 'none' });
    },
    async onSaveQr(event: { currentTarget: { dataset: { url: string } } }): Promise<void> {
      this.showFeedback(await saveContactQr(event.currentTarget.dataset.url));
    },
  },
});
