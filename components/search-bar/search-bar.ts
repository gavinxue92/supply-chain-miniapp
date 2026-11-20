Component({
  properties: {
    placeholder: {
      type: String,
      value: '请输入关键字搜索',
    },
    value: {
      type: String,
      value: '',
    },
  },
  data: {
    keyword: '',
  },
  observers: {
    value(value: string) {
      this.setData({ keyword: value });
    },
  },
  methods: {
    onInput(event: WechatMiniprogram.Input) {
      this.setData({ keyword: event.detail.value });
      this.triggerEvent('input', { value: event.detail.value });
    },
    onSearch() {
      this.triggerEvent('search', { keyword: this.data.keyword });
    },
  },
});
