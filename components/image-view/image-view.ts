Component({
  properties: {
    src: {
      type: String,
      value: '',
    },
    hint: {
      type: String,
      value: '图片加载失败',
    },
  },
  data: {
    failed: false,
  },
  observers: {
    src() {
      this.setData({ failed: false });
    },
  },
  methods: {
    onError() {
      this.setData({ failed: true });
    },
    onTap() {
      this.triggerEvent('imagetap');
    },
    onLongPress() {
      this.triggerEvent('imagelongpress');
    },
  },
});
