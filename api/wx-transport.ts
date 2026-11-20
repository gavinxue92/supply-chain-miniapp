import type { HttpRequestOptions, HttpResponse, RequestTransport } from './request';

export const wxTransport: RequestTransport = (options: HttpRequestOptions): Promise<HttpResponse> =>
  new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method,
      success: (response) => {
        resolve({ statusCode: response.statusCode, data: response.data as unknown });
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
