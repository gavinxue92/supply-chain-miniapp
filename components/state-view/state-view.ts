Component({
  properties: {
    state: {
      type: String,
      value: 'empty',
    },
    message: {
      type: String,
      value: '',
    },
  },
  methods: {
    onRetry() {
      this.triggerEvent('retry');
    },
    onBack() {
      this.triggerEvent('back');
    },
  },
});
