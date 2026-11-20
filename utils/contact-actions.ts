export interface ContactActionFeedback {
  ok: boolean;
  message: string;
}

export async function copyContactValue(value: string, label: string): Promise<ContactActionFeedback> {
  try {
    await wx.setClipboardData({ data: value });
    return { ok: true, message: `${label}已复制` };
  } catch {
    return { ok: false, message: '复制失败，请稍后重试' };
  }
}

export async function dialContactPhone(phone: string): Promise<ContactActionFeedback> {
  try {
    await wx.makePhoneCall({ phoneNumber: phone });
    return { ok: true, message: '正在拨打' };
  } catch {
    return { ok: false, message: '拨打失败，请稍后重试' };
  }
}

export function previewContactQr(url: string): void {
  wx.previewImage({ current: url, urls: [url] });
}

export function saveContactQr(url: string): Promise<ContactActionFeedback> {
  return new Promise((resolve) => {
    wx.downloadFile({
      url,
      success: async (result) => {
        if (result.statusCode !== 200) {
          resolve({ ok: false, message: '二维码保存失败' });
          return;
        }
        try {
          await wx.saveImageToPhotosAlbum({ filePath: result.tempFilePath });
          resolve({ ok: true, message: '二维码已保存到相册' });
        } catch {
          resolve({ ok: false, message: '二维码保存失败，请检查相册权限' });
        }
      },
      fail: () => resolve({ ok: false, message: '二维码保存失败，请检查网络' }),
    });
  });
}
