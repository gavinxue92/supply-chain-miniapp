import type { PublicCategory, PublicProductSummary } from '../types/catalog';

/** 首页一级分类入口：只保留树的顶层节点，顺序沿用后端。 */
export interface CategoryEntry {
  id: number;
  name: string;
  badgeText: string;
}

export function toFirstLevelCategories(tree: PublicCategory[]): CategoryEntry[] {
  return tree.map((category) => ({
    id: category.id,
    name: category.name,
    badgeText: category.name.slice(0, 1),
  }));
}

/** 产品列表的二级分类筛选项；顺序沿用后端 children，不重排。 */
export interface CategoryFilterOption {
  id: number;
  name: string;
}

/** 0 表示不筛选，展示全部产品。 */
export const ALL_CATEGORIES = 0;

export function toSecondLevelFilters(tree: PublicCategory[], firstLevelId: number): CategoryFilterOption[] {
  const firstLevel = tree.find((category) => category.id === firstLevelId);
  return (firstLevel?.children ?? []).map((child) => ({ id: child.id, name: child.name }));
}

/** 分类树信息缺失时，直接取产品摘要中已有的 categoryId 作为筛选依据。 */
export function toProductCategoryIds(products: PublicProductSummary[]): number[] {
  return [...new Set(products.map((product) => product.categoryId))];
}

/** 按二级分类 ID 本地过滤，保持后端顺序；ALL_CATEGORIES 表示不过滤。 */
export function filterProductsByCategory(
  products: PublicProductSummary[],
  categoryId: number,
): PublicProductSummary[] {
  if (categoryId === ALL_CATEGORIES) {
    return products;
  }
  return products.filter((product) => product.categoryId === categoryId);
}
