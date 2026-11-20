# 小程序接口契约参考

> 本文仅作为后端接口字段与规则的参考。页面范围、首页形态与交互以 `.scratch/supply-chain-miniapp/spec.md` 为准；本文第 1、2、7、8、9 节中与规格冲突的内容已废止，详见 ADR-0002。

接口字段、路径和业务规则以当前后端实现为准；不要按想象补充后端尚未提供的能力。

## 1. 旧版 V1 范围（已废止，见 spec.md）

本期必须交付的能力只有两条主线：

1. 分类展示产品列表：进入分类首页，选择分类后看到该分类下可见产品。
2. 产品详情与客服信息：点击产品进入详情页，查看图文详情，并在详情下方看到可用的客服联系方式。

以下为旧版排除项，已废止；现行范围见 spec.md（搜索已纳入 V1）：

- 搜索（后端已有 `GET /api/v1/products/search`，但 V1 不接入）
- 购物车、下单、支付、库存、客户账号/登录
- 微信客服会话、在线聊天
- 分页、排序切换、价格区间等筛选
- 商品分享参数、客户端身份识别

规格只是咨询选项，不是可购买 SKU；参考价不是成交价。

## 2. 旧版页面与数据流（已废止，见 spec.md）

```text
分类首页 (GET /categories)
   │ 点击一级或二级分类
   ▼
产品列表 (GET /categories/{id}/products)
   │ 点击某个产品
   ▼
产品详情 (GET /products/{id})  → 主图/轮播/图文详情/规格 → 底部客服联系信息
```

### 2.1 分类首页

- 调 `GET /api/v1/categories`，得到两级分类树。
- 固定只有两级：一级节点的 `children` 是二级节点，二级节点的 `children` 恒为 `[]`。
- 后端只返回启用且可见的分类；一级分类停用时，其二级分类和产品都不可见。
- 前端按 `sortOrder` 升序（同值按 `id`）展示，保留后端顺序。

### 2.2 产品列表

- 调 `GET /api/v1/categories/{id}/products`，`id` 为点击的分类 ID。
- 点击**二级分类**：返回该分类下已发布、未删除的产品。
- 点击**一级分类**：返回其下所有启用的二级分类中的产品；直接挂在一级分类下的产品不会返回（后端写入侧也不允许产品挂在一级分类）。
- 列表项字段：`name`、`mainImageUrl`、`specifications`、`referencePriceNotice`。
- 排序由后端完成（`sortOrder` 升序、同值按 `id`），前端不要再本地排序。
- 列表为空时 `data` 是 `[]`，这是正常状态，不要当成错误。

### 2.3 产品详情

- 调 `GET /api/v1/products/{id}`，`id` 来自列表项的 `id`。
- 展示内容从上到下建议为：主图 → 轮播图 → 名称 → 规格及参考价 → 图文详情 → 客服联系信息。
- 产品不可见、已下架或分类不可见时接口返回 `404`，不是空对象；此时应展示“商品已下架/不存在”并返回列表，而不是把 `404` 当空详情渲染。

## 3. 联调环境准备

- 后端 API 基址按环境配置，不要写死在代码中。本地联调默认 `http://localhost:8080`，示例前缀为 `/api/v1`。
- 小程序上线时必须使用 HTTPS，并在微信公众平台配置 request / download 合法域名；图片来自 `/api/v1/media/{id}`，同样需要可访问的 HTTPS 域名。
- 非生产环境可打开 Swagger UI：`http://{host}:8080/swagger-ui/index.html`；OpenAPI JSON 为 `http://{host}:8080/api/v1/openapi`。生产默认关闭 Swagger UI。
- 公开 GET 不需要登录、不需要后台会话、不需要 CSRF 凭证；不要调用 `/api/v1/admin/**`。

快速验证（把 `{host}` 换成实际地址）：

```bash
# 分类树
curl "http://{host}:8080/api/v1/categories"

# 某分类下的产品（把 11 换成实际分类 ID）
curl "http://{host}:8080/api/v1/categories/11/products"

# 产品详情（把 1001 换成实际产品 ID）
curl "http://{host}:8080/api/v1/products/1001"

# 图片（把 5001 换成实际媒体 ID，返回图片二进制）
curl -v "http://{host}:8080/api/v1/media/5001"
```

## 4. 通用响应约定

JSON 接口统一包一层 `Result<T>`：

```json
{
  "success": true,
  "data": { "...": "..." }
}
```

- `success: true` 表示业务成功，`data` 是实际数据；成功时 `message` 为 `null`。
- `success: false` 表示业务失败，`data` 为 `null`，`message` 有诊断文案。
- 后端开启了全局 `non_null` 序列化：**值为 `null` 的字段在 JSON 中直接缺失**。因此成功响应看不到 `message`，失败响应看不到 `data`，可空的 `referencePrice`、`wechatId`、`qrImageUrl`、`phone`、`contact` 也可能整个键消失。前端一律按“字段可能不存在”处理，不要假设键一定在。
- 必须同时判断 HTTP 状态码和 `success`；不能只看 HTTP 200。
- 错误响应体并不统一：
  - 业务 400/404（如分类或产品不存在、参数非法）由 Spring Boot 默认错误体返回，类似 `{"timestamp":"...","status":404,"error":"Not Found","path":"/api/v1/products/999","message":"Catalog resource not found"}`，**不是** `Result` 结构。
  - 仅安全层 401/403 会返回 `Result.failure` 结构；公开接口正常情况下不应遇到。
  - `message` 是后端诊断文案，不是稳定错误码；前端展示通用可理解提示即可，不要按英文文案做业务分支。

## 5. V1 接口清单

| 方法 | 路径 | 参数 | 用途 | `data` |
|---|---|---|---|---|
| `GET` | `/api/v1/categories` | 无 | 获取可见分类树 | `PublicCategory[]` |
| `GET` | `/api/v1/categories/{id}/products` | `id`：正整数路径参数 | 获取该分类下产品 | `PublicProductSummary[]` |
| `GET` | `/api/v1/products/{id}` | `id`：正整数路径参数 | 获取产品详情 | `PublicProductDetail` |
| `GET` | `/api/v1/media/{id}` | `id`：正整数路径参数 | 读取图片 | **图片二进制，不是 `Result`** |

说明：

- 路径参数必须是数字，非数字会得到 `400`。
- 没有分页参数、排序参数、筛选参数，返回完整列表。
- 分类/产品/媒体不存在、停用或不可见时返回 `404`；不要把 `404` 当空列表或空详情。
- 图片接口返回实际 `Content-Type`（`image/jpeg`、`image/png`、`image/webp` 之一），可直接作为 `image` 组件或富文本的图片源。

## 6. 数据结构

以下 TS 类型中的 `?:` 表示该字段在 JSON 中可能缺失（后端值为 `null` 时被省略）。

```ts
type PublicCategory = {
  id: number;
  name: string;
  sortOrder: number;
  children: PublicCategory[]; // 二级节点的 children 恒为 []
};

type PublicProductSpec = {
  name: string;
  referencePrice?: number; // 参考价；为 null 时字段缺失
  priceDisplay: string;    // 形如 "¥12.30"；无参考价时为 "面议"
};

type PublicProductSummary = {
  id: number;
  name: string;
  categoryId: number;      // 产品所属的末级分类 ID
  mainImageUrl: string;    // 相对路径，如 "/api/v1/media/5001"
  specifications: PublicProductSpec[];
  referencePriceNotice: string;
};

type PublicContactService = {
  displayName: string;
  wechatId?: string;   // 微信号，可能缺失
  qrImageUrl?: string; // 二维码图片相对路径，可能缺失
  phone?: string;      // 手机号，可能缺失
};

type ContactDisplay = {
  services: PublicContactService[]; // 按运营挂载顺序
};

type PublicProductDetail = {
  id: number;
  name: string;
  categoryId: number;
  mainImageUrl: string;
  galleryImageUrls: string[]; // 相对路径数组
  detailHtml: string;         // 后端已清洗的受限 HTML
  specifications: PublicProductSpec[];
  referencePriceNotice: string;
  contact?: ContactDisplay;   // 关闭/无客服时整个字段缺失
};
```

### 6.1 响应示例

分类树：

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "新鲜蔬菜",
      "sortOrder": 10,
      "children": [
        { "id": 11, "name": "叶菜", "sortOrder": 1, "children": [] },
        { "id": 12, "name": "根茎", "sortOrder": 2, "children": [] }
      ]
    }
  ]
}
```

产品列表：

```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "name": "有机菠菜",
      "categoryId": 11,
      "mainImageUrl": "/api/v1/media/5001",
      "specifications": [
        { "name": "500g/份", "referencePrice": 12.3, "priceDisplay": "¥12.30" },
        { "name": "1kg/份", "priceDisplay": "面议" }
      ],
      "referencePriceNotice": "参考价仅供参考，实际价格以客服沟通为准"
    }
  ]
}
```

产品详情：

```json
{
  "success": true,
  "data": {
    "id": 1001,
    "name": "有机菠菜",
    "categoryId": 11,
    "mainImageUrl": "/api/v1/media/5001",
    "galleryImageUrls": ["/api/v1/media/5002", "/api/v1/media/5003"],
    "detailHtml": "<p>产地直供，当日采摘。</p><img src=\"/api/v1/media/5004\" alt=\"实物图\">",
    "specifications": [
      { "name": "500g/份", "referencePrice": 12.3, "priceDisplay": "¥12.30" },
      { "name": "1kg/份", "priceDisplay": "面议" }
    ],
    "referencePriceNotice": "参考价仅供参考，实际价格以客服沟通为准",
    "contact": {
      "services": [
        {
          "displayName": "采购咨询",
          "wechatId": "veg-buyer",
          "qrImageUrl": "/api/v1/media/6001"
        },
        {
          "displayName": "电话咨询",
          "phone": "13800138000"
        }
      ]
    }
  }
}
```

注意示例中成功响应没有 `message`，无参考价的规格没有 `referencePrice`；这些都是 `non_null` 省略造成的正常现象。

## 7. 旧版展示与交互规则（已废止，见 spec.md）

### 7.1 列表与价格

- 用 `mainImageUrl` 展示主图；URL 是相对路径，与当前环境的后端基址拼接后再用。不要把开发域名写进数据或代码。
- 规格逐条展示 `name` 和 `priceDisplay`；不要自行格式化 `referencePrice`。空价格后端已给 `"面议"`。
- 同时展示 `referencePriceNotice`（当前为“参考价仅供参考，实际价格以客服沟通为准”），措辞不要改成“售价”“成交价”“立即购买”等。

### 7.2 图文详情

- `detailHtml` 是后端写入时清洗过的受限 HTML，只含 `p/br/h1~h6/ul/ol/li/strong/b/em/i/img`，`img` 只有 `src` 和 `alt` 属性。
- 使用小程序兼容的富文本组件展示；不要用 WebView 执行 HTML，不要注入脚本或外链图片。
- 图片地址同样是 `/api/v1/media/{id}` 形式的相对路径，需拼接基址。

### 7.3 客服联系信息（详情页下方）

- `contact` 缺失表示客服入口关闭，或没有可展示的客服；此时**不要显示空白卡片，也不要伪造客服信息**。
- 有 `contact` 时按 `services` 数组顺序展示；后端已按运营挂载顺序返回，并已过滤停用客服，前端不要重排。
- 每项先展示 `displayName`，然后只展示实际存在的字段：
  - `wechatId`：展示微信号，提供复制，并给出复制成功/失败反馈。
  - `qrImageUrl`：相对路径，拼接基址后展示二维码图片，点击可预览大图。
  - `phone`：展示号码，支持复制和拨打；拨打/复制都给反馈。
- 同一项可以同时有多个联系方式；三个字段都可能缺失，必须逐项判空。

## 8. 错误处理与联调注意事项

- 处理网络失败、非 2xx、`success: false`、空列表、`404` 和图片加载失败；图片失败时显示占位图。
- 分类切换或详情页进入较快时，只接受最新一次请求的响应，避免旧结果覆盖新结果。
- 接口没有分页参数，返回完整列表；现行 V1 采用前端本地分批渲染（见 spec.md），不是网络分页。
- 当前 `message` 是诊断文案，不是错误码；前端展示通用提示即可。
- 公开接口不需要 CSRF；小程序不要接触 `ADMIN_SESSION`、`X-XSRF-TOKEN` 等管理端凭证。
- 图片接口返回二进制，不是 JSON；不要把 `/api/v1/media/{id}` 当 JSON 请求解析。

## 9. 旧版联调验收清单（已废止，见 spec.md）

- [ ] 分类首页能展示两级分类，二级分类没有多余层级。
- [ ] 点击一级分类能看到其下所有启用二级分类的产品；点击二级分类只看到该分类产品。
- [ ] 列表为空时显示空状态，不报错。
- [ ] 列表项主图、名称、规格、`priceDisplay`、`referencePriceNotice` 展示正确；服务端排序未被打乱。
- [ ] 点击列表项进入详情，主图、轮播、规格、图文详情正常显示。
- [ ] 图文详情里的图片能加载，且没有脚本或外链注入。
- [ ] 详情底部客服区：`contact` 缺失时不展示；存在时按 `services` 顺序展示，仅展示存在的微信号/二维码/电话。
- [ ] 复制微信号/电话有明确反馈；电话可拨打；二维码可预览。
- [ ] 访问不存在的分类/产品得到 `404` 时，展示友好提示并能返回，不出现白屏。
- [ ] 图片相对地址已拼接当前环境基址；切换环境后无需改代码。

## 10. 契约边界与依据

- 当前没有分页、排序、筛选、商品分享参数或客户端身份接口；不要按未实现契约开发。
- API 前缀和字段若有调整，以同版本后端 OpenAPI 3 契约及实际接口变更为准：`/api/v1/openapi`。
- 依据文档：`.scratch/supply-chain-backend/spec.md`、`docs/adr/0002-api-boundaries.md`、`docs/adr/0003-category-model.md`、`docs/adr/0004-product-and-contact-rules.md`、`docs/adr/0005-object-storage.md`、`docs/adr/0006-rich-text.md`、`docs/adr/0011-customer-service-entities.md`、`docs/adr/0012-media-lifecycle.md`。
