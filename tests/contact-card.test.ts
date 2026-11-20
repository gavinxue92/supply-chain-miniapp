import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContactDisplay } from '../types/catalog';
import { toContactCardView } from '../utils/detail';
import { copyContactValue, dialContactPhone, saveContactQr } from '../utils/contact-actions';

afterEach(() => {
  vi.unstubAllGlobals();
});

const contact: ContactDisplay = {
  services: [
    { displayName: '采购咨询', wechatId: 'veg-buyer', qrImageUrl: '/api/v1/media/6001' },
    { displayName: '电话咨询', phone: '13800138000' },
    { displayName: '通用咨询' },
  ],
};

describe('客服卡片渲染', () => {
  it('联系方式按后端顺序展示，二维码拼接环境基址且缺省字段不伪造', () => {
    expect(toContactCardView(contact, 'http://localhost:8080')).toEqual({
      services: [
        {
          displayName: '采购咨询',
          wechatId: 'veg-buyer',
          qrImageUrl: 'http://localhost:8080/api/v1/media/6001',
        },
        { displayName: '电话咨询', phone: '13800138000' },
        { displayName: '通用咨询' },
      ],
    });
  });
});

describe('客服联系操作反馈', () => {
  it('复制微信号成功时给出明确反馈', async () => {
    const setClipboardData = vi.fn(() => Promise.resolve({ errMsg: 'setClipboardData:ok' }));
    vi.stubGlobal('wx', { setClipboardData });

    await expect(copyContactValue('veg-buyer', '微信号')).resolves.toEqual({
      ok: true,
      message: '微信号已复制',
    });
    expect(setClipboardData).toHaveBeenCalledWith({ data: 'veg-buyer' });
  });

  it('复制失败时给出明确反馈', async () => {
    vi.stubGlobal('wx', { setClipboardData: vi.fn(() => Promise.reject(new Error('denied'))) });

    await expect(copyContactValue('veg-buyer', '微信号')).resolves.toEqual({
      ok: false,
      message: '复制失败，请稍后重试',
    });
  });

  it('拨打手机号成功与失败都有反馈', async () => {
    vi.stubGlobal('wx', { makePhoneCall: vi.fn(() => Promise.resolve({ errMsg: 'makePhoneCall:ok' })) });
    await expect(dialContactPhone('13800138000')).resolves.toEqual({ ok: true, message: '正在拨打' });

    vi.stubGlobal('wx', { makePhoneCall: vi.fn(() => Promise.reject(new Error('denied'))) });
    await expect(dialContactPhone('13800138000')).resolves.toEqual({
      ok: false,
      message: '拨打失败，请稍后重试',
    });
  });

  it('二维码先下载再保存，成功后反馈已保存到相册', async () => {
    const downloadFile = vi.fn((options: { success: (result: { statusCode: number; tempFilePath: string }) => void }) => {
      options.success({ statusCode: 200, tempFilePath: '/tmp/qr.png' });
    });
    const saveImageToPhotosAlbum = vi.fn(() => Promise.resolve({ errMsg: 'saveImageToPhotosAlbum:ok' }));
    vi.stubGlobal('wx', { downloadFile, saveImageToPhotosAlbum });

    await expect(saveContactQr('http://localhost:8080/api/v1/media/6001')).resolves.toEqual({
      ok: true,
      message: '二维码已保存到相册',
    });
    expect(downloadFile).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://localhost:8080/api/v1/media/6001' }),
    );
    expect(saveImageToPhotosAlbum).toHaveBeenCalledWith({ filePath: '/tmp/qr.png' });
  });

  it('二维码下载非成功状态时不调用相册保存', async () => {
    const saveImageToPhotosAlbum = vi.fn();
    vi.stubGlobal('wx', {
      downloadFile: vi.fn((options: { success: (result: { statusCode: number; tempFilePath: string }) => void }) => {
        options.success({ statusCode: 404, tempFilePath: '' });
      }),
      saveImageToPhotosAlbum,
    });

    await expect(saveContactQr('http://localhost:8080/api/v1/media/9999')).resolves.toEqual({
      ok: false,
      message: '二维码保存失败',
    });
    expect(saveImageToPhotosAlbum).not.toHaveBeenCalled();
  });
});
