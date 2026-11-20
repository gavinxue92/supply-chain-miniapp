import { describe, expect, it } from 'vitest';
import type { PublicCategory, PublicProductSummary } from '../types/catalog';
import {
  ALL_CATEGORIES,
  filterProductsByCategory,
  toFirstLevelCategories,
  toProductCategoryIds,
  toSecondLevelFilters,
} from '../utils/category';
import { mergeCategoryPreview } from '../utils/preview';
import { NEGOTIABLE_PRICE, toProductCardData, toProductCards } from '../utils/product';

const tree: PublicCategory[] = [
  {
    id: 1,
    name: '新鲜蔬菜',
    sortOrder: 10,
    children: [
      { id: 11, name: '叶菜', sortOrder: 1, children: [] },
      { id: 12, name: '根茎', sortOrder: 2, children: [] },
    ],
  },
  { id: 2, name: '时令水果', sortOrder: 20, children: [] },
];

function product(id: number): PublicProductSummary {
  return {
    id,
    name: `产品 ${id}`,
    categoryId: 11,
    mainImageUrl: `/api/v1/media/${5000 + id}`,
    specifications: [{ name: '500g/份', priceDisplay: '¥12.30' }],
    referencePriceNotice: '参考价仅供参考，实际价格以客服沟通为准',
  };
}

describe('一级分类', () => {
  it('分类树只映射一级分类并保持后端顺序', () => {
    expect(toFirstLevelCategories(tree)).toEqual([
      { id: 1, name: '新鲜蔬菜', badgeText: '新' },
      { id: 2, name: '时令水果', badgeText: '时' },
    ]);
  });

  it('空分类树映射为空的一级分类', () => {
    expect(toFirstLevelCategories([])).toEqual([]);
  });
});

describe('分类产品预览', () => {
  it('按分类顺序合并预览产品并在限量处截止', () => {
    expect(mergeCategoryPreview([[product(1001), product(1002)], [product(1003), product(1004)]], 3)).toEqual([
      product(1001),
      product(1002),
      product(1003),
    ]);
  });

  it('重复产品只保留首次出现，不重排后续产品', () => {
    expect(mergeCategoryPreview([[product(1001), product(1002)], [product(1002), product(1003)]], 4)).toEqual([
      product(1001),
      product(1002),
      product(1003),
    ]);
  });

  it('没有可用产品时返回空预览', () => {
    expect(mergeCategoryPreview([[], []], 4)).toEqual([]);
  });

  it('预览卡逐条展示规格、原样使用后端价格文案并拼接环境基址', () => {
    const item = product(1001);
    expect(toProductCardData(item, 'http://localhost:8080')).toEqual({
      id: 1001,
      imageUrl: 'http://localhost:8080/api/v1/media/6001',
      name: '产品 1001',
      specifications: [{ name: '500g/份', priceDisplay: '¥12.30', isNegotiable: false }],
      notice: '参考价仅供参考，实际价格以客服沟通为准',
    });
  });

  it('批量产品卡映射保持后端顺序', () => {
    expect(toProductCards([product(1001), product(1002)], 'http://localhost:8080').map((item) => item.id)).toEqual([
      1001, 1002,
    ]);
  });

  it('无参考价的规格逐条原样展示面议', () => {
    const item = product(1002);
    item.specifications = [
      { name: '500g/份', priceDisplay: '¥12.30' },
      { name: '1kg/份', priceDisplay: NEGOTIABLE_PRICE },
    ];
    expect(toProductCardData(item, 'http://localhost:8080').specifications).toEqual([
      { name: '500g/份', priceDisplay: '¥12.30', isNegotiable: false },
      { name: '1kg/份', priceDisplay: NEGOTIABLE_PRICE, isNegotiable: true },
    ]);
  });
});

describe('二级分类筛选', () => {
  it('筛选选项只取该一级分类下的二级分类并保持后端顺序', () => {
    expect(toSecondLevelFilters(tree, 1)).toEqual([
      { id: 11, name: '叶菜' },
      { id: 12, name: '根茎' },
    ]);
  });

  it('没有匹配的一级分类时没有筛选选项', () => {
    expect(toSecondLevelFilters(tree, 999)).toEqual([]);
  });

  it('分类树信息缺失时按产品 categoryId 派生筛选依据且不重复', () => {
    expect(toProductCategoryIds([product(1001), product(1002), product(1003)])).toEqual([11]);
    const items = [product(1001), product(1002)];
    items[1].categoryId = 12;
    expect(toProductCategoryIds(items)).toEqual([11, 12]);
  });

  it('本地筛选保持后端顺序，全部筛选项恢复完整产品列表', () => {
    const items = [product(1001), product(1002), product(1003)];
    items[1].categoryId = 12;
    items[2].categoryId = 11;

    expect(filterProductsByCategory(items, 11)).toEqual([items[0], items[2]]);
    expect(filterProductsByCategory(items, 12)).toEqual([items[1]]);
    expect(filterProductsByCategory(items, ALL_CATEGORIES)).toEqual(items);
  });
});
