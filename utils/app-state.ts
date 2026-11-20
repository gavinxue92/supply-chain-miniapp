import type { CategoryFilterOption } from './category';

export interface AppGlobalData {
  searchKeyword: string;
  filterOptionsByCategory: Record<number, CategoryFilterOption[]>;
}

export function getAppGlobalData(): AppGlobalData {
  return (getApp() as { globalData: AppGlobalData }).globalData;
}

export function setSearchKeyword(keyword: string): void {
  getAppGlobalData().searchKeyword = keyword;
}

export function setCategoryFilterOptions(categoryId: number, options: CategoryFilterOption[]): void {
  getAppGlobalData().filterOptionsByCategory[categoryId] = options;
}

export function getCategoryFilterOptions(categoryId: number): CategoryFilterOption[] {
  return getAppGlobalData().filterOptionsByCategory[categoryId] ?? [];
}
