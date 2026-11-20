import type { CategoryEntry } from '../../utils/category';

const BADGE_COLORS = ['#5aa469', '#e6a23c', '#c05b5b', '#4a90c2', '#9b7b4f', '#7a6aa8'];

/** 原型示例分类的图标文字；其余分类沿用名称首字，避免把展示文案写进数据层。 */
const PROTOTYPE_BADGE_TEXT: Record<string, string> = {
  新鲜蔬菜: '蔬',
  时令水果: '果',
  肉禽蛋品: '肉',
  水产海鲜: '水',
  粮油调味: '粮',
  干货菌菇: '干',
};

Component({
  properties: {
    category: {
      type: Object,
      value: {},
    },
    index: {
      type: Number,
      value: 0,
    },
  },
  data: {
    badgeColor: BADGE_COLORS[0],
    badgeText: '',
  },
  observers: {
    index(index: number) {
      this.setData({ badgeColor: BADGE_COLORS[index % BADGE_COLORS.length] });
    },
    category(category: CategoryEntry) {
      this.setData({
        badgeText: PROTOTYPE_BADGE_TEXT[category?.name] ?? category?.badgeText ?? '',
      });
    },
  },
  methods: {
    onTap() {
      const category = this.data.category as CategoryEntry | null;
      if (category) {
        this.triggerEvent('select', { id: category.id, name: category.name });
      }
    },
  },
});
