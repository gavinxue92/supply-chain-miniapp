# 食材目录小程序（用户端 V1 · 工单 01）

原生微信小程序 + TypeScript，浏览无需登录的公开目录。01–05 已交付完整浏览链路：分类首页、产品列表与二级筛选、独立搜索、产品详情与图文、客服联系卡片；06 的代码侧统一错误态、图片占位、竞态与环境/凭证审计已完成，真机 HTTPS 与合法域名配置待人工验收。

## 运行

```bash
npm install
npm run build      # 在源码旁生成小程序加载的 .js
npm run dev        # 开发时持续编译
npm test           # vitest 接缝测试
npm run typecheck  # 严格类型检查
```

用微信开发者工具「导入项目」选择本目录，AppID 可用测试号。开发/unknown 环境使用 `http://localhost:8080`；真机需在「详情 - 本地设置」关闭域名校验，或使用已配置合法域名的体验/生产基址。

## 环境基址

三套基址与自动探测只在 `config/environment.ts`：

- 开发：`http://localhost:8080`
- 体验：`https://trial.example.invalid`（占位，替换为真实域名）
- 生产：`https://api.example.invalid`（占位，替换为真实域名）

修改 `ENVIRONMENT_OVERRIDE` 可强制切换；留空时按微信开发版 / 体验版 / 正式版自动选择。所有相对图片路径统一经 `utils/url.ts` 拼接。

## 目录职责

- `types/`：后端响应类型，可空字段用 `?:`，禁止 `any`
- `api/`：公开接口封装与错误归一化，只在 `wx-transport.ts` 接触 `wx.request`
- `utils/`：分类映射、预览合并、图片地址拼接、结果归一化
- `config/`：三套环境基址单一出口
- `pages/`、`components/`、`assets/`：展示层，后续重设计只改这些目录
- `tests/`：公开接口接缝与纯逻辑接缝测试

## 约束

只调用 `/api/v1` 公开接口；不接触后台会话、CSRF、客户登录；规格与参考价文案原样展示，不表述为售价或可购买 SKU。
