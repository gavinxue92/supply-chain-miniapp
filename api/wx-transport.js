"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wxTransport = void 0;
const wxTransport = (options) => new Promise((resolve, reject) => {
    wx.request({
        url: options.url,
        method: options.method,
        success: (response) => {
            resolve({ statusCode: response.statusCode, data: response.data });
        },
        fail: (error) => {
            reject(error);
        },
    });
});
exports.wxTransport = wxTransport;
