interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
}

Component({
  data: {
    active: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '/assets/icons/home.png' },
      { pagePath: '/pages/category/category', text: '分类', icon: '/assets/icons/category.png' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '/assets/icons/user.png' },
    ] as TabItem[],
  },
  methods: {
    onTap(event: { currentTarget: { dataset: { index: number; path: string } } }): void {
      const { index, path } = event.currentTarget.dataset;
      if (index === this.data.active) {
        return;
      }
      wx.switchTab({ url: path });
    },
  },
});
