import { describe, expect, it } from 'vitest';
import { getApiBaseUrl } from '../config/environment';
import { resolveImageUrl } from '../utils/url';

describe('环境基址', () => {
  it('开发默认指向本地后端', () => {
    expect(getApiBaseUrl('development')).toBe('http://localhost:8080');
  });

  it('体验与生产使用各自独立的环境基址', () => {
    expect(getApiBaseUrl('trial')).toBe('https://trial.example.invalid');
    expect(getApiBaseUrl('production')).toBe('https://api.example.invalid');
  });

  it('相对媒体路径与当前环境基址拼接为可访问图片地址', () => {
    expect(resolveImageUrl('/api/v1/media/5001', 'http://localhost:8080')).toBe(
      'http://localhost:8080/api/v1/media/5001',
    );
  });

  it('环境基址带尾斜杠时不产生重复斜杠', () => {
    expect(resolveImageUrl('/api/v1/media/5001', 'https://api.example.invalid/')).toBe(
      'https://api.example.invalid/api/v1/media/5001',
    );
  });

  it('已是绝对地址的图片保持原样', () => {
    expect(resolveImageUrl('https://cdn.example.invalid/pic.png', 'http://localhost:8080')).toBe(
      'https://cdn.example.invalid/pic.png',
    );
  });

  it('缺省图片路径返回空串而不是拼出错误地址', () => {
    expect(resolveImageUrl(undefined, 'http://localhost:8080')).toBe('');
  });
});
