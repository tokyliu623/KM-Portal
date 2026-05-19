---
name: vivo-doc-reader
version: "2.0"
description: >
  读取 vivo 在线文档（Excel/CSV/JSON）的 Skill。
  触发词：vivo文档、docs.vivo.xyz、在线表格、读取vivo文档内容。
  首次使用时会自动引导配置 API Token。
---

# vivo-doc-reader

通过 QDS API 服务读取 vivo 在线表格，支持 Excel 多 Sheet、CSV、JSON 解析。

## 功能

- 读取 docs.vivo.xyz 上的在线表格
- 支持 Excel (.xlsx/.xls) 多 Sheet 解析
- 支持 CSV、JSON 格式解析
- 7 天缓存机制（服务端）
- 并发控制

## 首次使用

首次使用时会自动引导配置：
1. **API Token**：vivo文档 → 个人中心 → 开发者配置 → 分享至系统（选择"质量数据管理"）→ 复制密钥
2. **QDS API 地址**（可选）：
   - 生产环境（默认）：`https://qds-test.vmic.xyz/api/vivo-docs`
   - 开发环境：`http://localhost:5051`

## 使用方式

直接提供文档链接即可读取数据：

```
读取 https://docs.vivo.xyz/s/xxx 数据
```

## 配置说明

配置保存在 `config/user.json`，格式如下：

```json
{
  "api_token": "您的API Token",
  "qds_api_url": "http://localhost:5051"
}
```

## 依赖

- requests>=2.31.0

## 注意事项

- 确保 QDS API 服务已启动
- API Token 需已分享给"质量数据管理"系统
- 分享链接需以 /i/ 或 /s/ 开头