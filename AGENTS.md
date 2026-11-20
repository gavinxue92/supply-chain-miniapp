# 小程序端架构与协作规约

本项目是原生微信小程序，接入 `supply-chain-backend` 的公开目录接口。客户无需登录即可浏览分类、产品与客服信息。

## 技术栈与目录

- 使用原生微信小程序 + TypeScript；不引入 uni-app、Taro 等跨端框架。
- 目录职责：
  - `types/`：所有后端响应与请求结构定义严格 TypeScript 类型，禁止 `any`；后端 `non_null` 序列化导致可空字段缺失，对应字段用 `?:`。
  - `api/`：公开接口的请求封装，只暴露业务语义方法。
  - `utils/`：请求基址拼接、错误归一化、本地分批渲染、竞态控制等纯逻辑。
  - `config/`：开发/体验/生产三套 API 基址，单一出口。
  - `pages/`、`components/`、`assets/`：页面、可复用组件与静态资源。
- 页面与交互范围以 `.scratch/supply-chain-miniapp/spec.md` 为准；初版视觉以 `prototype/index.html` 为唯一基线。`mini-program.md` 仅作为接口字段与后端规则参考。
- 展示层与数据逻辑分离：页面只组合组件，后期 UI 重设计只改 `pages/`、`components/`、`assets/`，不改 `types/`、`api/`、`utils/`、`config/` 的契约。详见 `docs/adr/0004-prototype-first-ui.md`。

## 接口与数据边界

- 只调用 `/api/v1` 公开接口：分类树、分类下产品、产品详情、搜索、图片。禁止调用 `/api/v1/admin/**`。
- 禁止持有或发送后台会话 Cookie、CSRF Token 等管理端凭证；小程序不接触客户登录体系。
- 图片地址是相对路径，必须在请求/展示层统一与当前环境 `baseURL` 拼接；禁止硬编码域名、客服微信号、手机号或二维码。
- 成功判断必须同时检查 HTTP 状态码与响应 `success` 字段；`404` 必须与客户可见的“无数据”区分处理。
- 规格是咨询选项，不是可购买 SKU；价格只按后端 `priceDisplay` 与 `referencePriceNotice` 展示，不得表述为售价、成交价或购买承诺。

## 测试接缝

- 唯一最高接缝：`/api/v1` 公开 REST 契约 + 页面可观察行为。
- 纯逻辑（类型映射、URL 拼接、本地分批渲染、竞态控制）用 vitest 验证；不测后端内部实现，不测小程序框架内部。
- 测试名称使用 `GLOSSARY.md` 的术语。

## Agent 技能

### 问题跟踪

规格与工单以本地 Markdown 形式存放在 `.scratch/supply-chain-miniapp/`。详见 `docs/agents/issue-tracker.md`。

### 领域文档

采用单上下文布局，根目录包含 `GLOSSARY.md`，并使用 `docs/adr/` 存放架构决策记录。详见 `docs/agents/domain.md`。
