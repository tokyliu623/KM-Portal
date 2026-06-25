---
name: km-operation-builder
description: 知识库运营Skill生成器。触发词：知识库运营、KB开发、知识库模板、创建KB Skill
---

# km-operation-builder

> 知识库运营Skill生成器 - 一键创建知识库运营助手

## 基本信息

| 属性 | 值 |
|------|-----|
| **名称** | km-operation-builder |
| **版本** | 1.0.0 |
| **描述** | 知识库运营Skill生成器，通过配置引导快速生成标准化的知识库运营Skill |
| **触发词** | 知识库运营、KB开发、知识库模板、创建KB Skill |

## 核心功能

### 一键创建知识库运营助手

```python
from scripts.builder_entry import builder_create

result = builder_create(
    kb_name="质见未来",      # 知识库名称
    kb_id=25706,            # 知识库 ID
    token="u-xxxx",         # wiki.vivo.xyz 的 accessToken
    owner="张三"            # 所有者名称
)
```

### 返回结果

```python
{
    "success": True,
    "skill_name": "kb-zhi-jian-wei-lai-operation",
    "install_path": "C:/Users/xxx/.config/bluecode/skills/kb-zhi-jian-wei-lai-operation",
    "zip_path": "C:/Users/xxx/.config/bluecode/skills/kb-zhi-jian-wei-lai-operation-v1.0.0.zip",
    "message": "知识库运营助手创建成功！..."
}
```

## 流程说明

```
用户 A 创建助手：
┌─────────────────────────────────────────────────────────────────┐
│ 1. builder_create(kb_name, kb_id, token, owner)                 │
│ 2. 验证 kb_id 权限                                              │
│ 3. 上传 token 到 KM-API（服务端存储 token ↔ kb_id 映射）        │
│ 4. 生成 Skill（配置: kb_id + kb_name，无 token 信息）           │
│ 5. 自动安装到 ~/.config/bluecode/skills/                        │
│ 6. 自动打包为 kb-{name}-operation-v1.0.0.zip                    │
└─────────────────────────────────────────────────────────────────┘

用户 B 使用助手：
┌─────────────────────────────────────────────────────────────────┐
│ 1. 接收 zip 包                                                  │
│ 2. 解压到 ~/.config/bluecode/skills/                            │
│ 3. 重启 BlueCode                                                │
│ 4. 通过触发词使用（无需任何配置）                                │
└─────────────────────────────────────────────────────────────────┘
```

## Token 获取步骤

1. 登录 https://wiki.vivo.xyz
2. 点击右上角头像 → 开放接口授权
3. 点击"添加授权"
4. 授权系统选择"个人使用"
5. 选择需要授权的知识库
6. 复制 accessToken（格式：u-xxxx）

## API 配置

- **KM-API 服务**: https://qds-test.vmic.xyz/api/km-api（硬编码，无需配置）
- **认证方式**: kb_id（KM-API 服务端自动通过 kb_id 查找对应 token）

## 模板类型

| 模板 | 说明 | 适用场景 |
|------|------|---------|
| **operation** | browse + read + stats + health + analyze | 知识运营、问题诊断 |
| **analysis** | browse + read + summarize + keywords + compare | 内容分析、洞察提取 |
| **distribution** | browse + read + generate_reply + publish | 内容分发、评论回复 |

## 其他函数

### 检查 KM-API 连接

```python
from scripts.builder_entry import builder_check_connection

result = builder_check_connection()
# {success: True, connected: True, message: "KM_API 连接正常"}
```

### 翻译知识库名称为英文候选

```python
from scripts.builder_entry import builder_translate_name

result = builder_translate_name("质见未来", count=3, kb_id=25706)
# 返回: {
#     "success": True,
#     "candidates": [
#         "kb-future-vision-operation",
#         "kb-quality-horizon-operation",
#         "kb-innovation-forward-operation"
#     ],
#     "original": "质见未来"
# }
```

> **kb_id 参数说明**：传入知识库 ID 可启用会话复用，同一知识库的多次翻译共享上下文，提升翻译一致性。不传则每次请求独立会话。

### 验证 kb_id 权限

```python
from scripts.builder_entry import builder_validate_kb

result = builder_validate_kb(
    token="u-xxxx",
    kb_id=25706
)
# 返回: {
#     "success": True,
#     "valid": True,
#     "kb_name": "质见未来",
#     "authorized_kbs": [...]
# }
```

### 获取 Token 可访问的知识库

```python
from scripts.builder_entry import builder_list_my_kbs

result = builder_list_my_kbs(token="u-xxxx")
# 返回: {
#     "success": True,
#     "kbs": [{kb_id, kb_name, permission, link}],
#     "count": 5
# }
```

### 获取可访问的知识库

```python
from scripts.builder_entry import builder_list_kbs

result = builder_list_kbs(token="u-xxxx")
# {success: True, kbs: [{kb_id, kb_name, permission, link}], count: int}
```

## 生成结构

```
kb-{name}-operation/
├── SKILL.md                  # Skill入口（UTF-8 BOM + front matter）
├── README.md                 # 使用说明
├── config/
│   └── user.json             # 用户配置（kb_id + kb_name）
└── scripts/
    ├── __init__.py           # 统一入口
    ├── kb_config.py          # 配置管理
    ├── kb_client.py          # API客户端
    ├── kb_explorer.py        # 浏览模块
    ├── kb_document.py        # 文档操作
    ├── kb_analysis.py        # 分析模块
    ├── kb_operation.py       # 运营模块
    └── kb_distribute.py      # 分发模块
```