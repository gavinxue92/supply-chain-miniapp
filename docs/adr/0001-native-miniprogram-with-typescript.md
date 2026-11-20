# ADR-0001：原生小程序 + TypeScript

**Status:** accepted
**Date:** 2026-11-20

## Context

本项目只需要交付微信小程序，不需要跨端。团队已有 Vue 3 + TypeScript 经验，但跨端框架会带来额外的构建层、条件编译与平台差异。后端公开接口契约已稳定，客户端主要工作是请求编排、类型映射、页面状态与展示逻辑，这些都可以用纯模块承载并单独测试。

## Decision

采用原生微信小程序 + TypeScript，不引入 uni-app、Taro 等跨端框架。工程按 `types`、`api`、`utils`、`config`、`pages`、`components`、`assets` 划分职责；请求、URL 拼接、本地分批渲染、竞态控制等逻辑写成纯模块，用 vitest 在公开接口接缝上验证。

## Consequences

- 后续若真的需要多端，需要另起技术选型，本决策不预留跨端抽象。
- 需要自行封装请求与错误归一化，不能依赖浏览器生态的 Axios 等库。
- 富文本展示受小程序 `rich-text` 能力限制，必须在真机验证后端清洗后的 HTML。
- 收益是依赖少、契约边界清楚、核心逻辑可脱离页面测试。
