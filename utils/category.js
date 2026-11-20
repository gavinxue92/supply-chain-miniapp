"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_CATEGORIES = void 0;
exports.toFirstLevelCategories = toFirstLevelCategories;
exports.toSecondLevelFilters = toSecondLevelFilters;
exports.toProductCategoryIds = toProductCategoryIds;
exports.filterProductsByCategory = filterProductsByCategory;
function toFirstLevelCategories(tree) {
    return tree.map((category) => ({
        id: category.id,
        name: category.name,
        badgeText: category.name.slice(0, 1),
    }));
}
/** 0 表示不筛选，展示全部产品。 */
exports.ALL_CATEGORIES = 0;
function toSecondLevelFilters(tree, firstLevelId) {
    const firstLevel = tree.find((category) => category.id === firstLevelId);
    return (firstLevel?.children ?? []).map((child) => ({ id: child.id, name: child.name }));
}
/** 分类树信息缺失时，直接取产品摘要中已有的 categoryId 作为筛选依据。 */
function toProductCategoryIds(products) {
    return [...new Set(products.map((product) => product.categoryId))];
}
/** 按二级分类 ID 本地过滤，保持后端顺序；ALL_CATEGORIES 表示不过滤。 */
function filterProductsByCategory(products, categoryId) {
    if (categoryId === exports.ALL_CATEGORIES) {
        return products;
    }
    return products.filter((product) => product.categoryId === categoryId);
}
