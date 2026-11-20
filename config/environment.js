"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENVIRONMENTS = void 0;
exports.getCurrentEnvironment = getCurrentEnvironment;
exports.getApiBaseUrl = getApiBaseUrl;
/**
 * 三套环境基址集中在此模块。trial / production 为占位域名，
 * 上线前由部署者替换为已配置合法域名的真实地址。
 */
exports.ENVIRONMENTS = {
    development: { baseUrl: 'http://localhost:8080' },
    // 体验版：腾讯云试用机，HTTP + 公网 IP，仅在真机「打开调试」时可用
    trial: { baseUrl: 'http://212.64.84.45:8080' },
    production: { baseUrl: 'https://api.example.invalid' },
};
/**
 * 单一环境开关。设置后优先于微信运行环境；
 * 留空时按微信版本自动选择：开发版 / 体验版 / 正式版。
 */
const ENVIRONMENT_OVERRIDE = undefined;
function wxAccountInfo() {
    return typeof wx === 'undefined' ? undefined : wx;
}
function getCurrentEnvironment() {
    if (ENVIRONMENT_OVERRIDE) {
        return ENVIRONMENT_OVERRIDE;
    }
    const envVersion = wxAccountInfo()?.getAccountInfoSync?.().miniProgram?.envVersion;
    if (envVersion === 'trial') {
        return 'trial';
    }
    if (envVersion === 'release') {
        return 'production';
    }
    return 'development';
}
function getApiBaseUrl(environment = getCurrentEnvironment()) {
    return exports.ENVIRONMENTS[environment].baseUrl;
}
