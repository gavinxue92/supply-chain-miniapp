"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyContactValue = copyContactValue;
exports.dialContactPhone = dialContactPhone;
exports.previewContactQr = previewContactQr;
exports.saveContactQr = saveContactQr;
async function copyContactValue(value, label) {
    try {
        await wx.setClipboardData({ data: value });
        return { ok: true, message: `${label}已复制` };
    }
    catch {
        return { ok: false, message: '复制失败，请稍后重试' };
    }
}
async function dialContactPhone(phone) {
    try {
        await wx.makePhoneCall({ phoneNumber: phone });
        return { ok: true, message: '正在拨打' };
    }
    catch {
        return { ok: false, message: '拨打失败，请稍后重试' };
    }
}
function previewContactQr(url) {
    wx.previewImage({ current: url, urls: [url] });
}
function saveContactQr(url) {
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
                }
                catch {
                    resolve({ ok: false, message: '二维码保存失败，请检查相册权限' });
                }
            },
            fail: () => resolve({ ok: false, message: '二维码保存失败，请检查网络' }),
        });
    });
}
