"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestClient = createRequestClient;
const result_1 = require("../utils/result");
/** 传输层可注入；页面只拿到归一化后的结果，不接触状态码与原始响应。 */
function createRequestClient(transport, baseUrl) {
    return async function request(path) {
        try {
            const response = await transport({ url: `${baseUrl}${path}`, method: 'GET' });
            return (0, result_1.normalizeApiResult)(response.statusCode, response.data);
        }
        catch {
            return { kind: 'failure', message: '网络异常，请检查网络后重试' };
        }
    };
}
