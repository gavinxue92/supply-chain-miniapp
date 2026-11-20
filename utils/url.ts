const ABSOLUTE_URL = /^https?:\/\//i;

/** 把后端相对图片路径拼成当前环境可访问的图片地址；缺省路径返回空串。 */
export function resolveImageUrl(path: string | undefined, baseUrl: string): string {
  if (!path) {
    return '';
  }
  if (ABSOLUTE_URL.test(path)) {
    return path;
  }
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
