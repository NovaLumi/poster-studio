# Poster Studio Skill

生成 2400×3600 长图文海报，使用自定义 CSS 模板 + Playwright 截图。

## 配置文件

`poster-config.json`（位于 skill 目录下）：

```json
{
  "author": "@你的名字",
  "avatar": "avatar.jpg",
  "brandColor": "#FF4B2B",
  "summaryCards": [
    { "title": "码住干货", "desc": "放进收藏夹\n避免灵感丢失", "icon": "bookmark" },
    { "title": "留下红心", "desc": "如果你觉得\n本期干货有用", "icon": "heart" },
    { "title": "关注作者", "desc": "持续拆解发布\n图文排版体系", "icon": "avatar" }
  ]
}
```

- `avatar`: 头像文件名，相对于配置文件所在目录
- `icon`: `bookmark`（书签）、`heart`（红心）、`avatar`（作者头像）

## 输入格式

```json
{
  "topic": "主题名称",
  "slides": [
    {
      "type": "cover|article|steps|cards|indepth|manifesto|summary",
      "tag": "标签文字",
      "title": "标题（可用\\n换行）",
      "text1": "正文1",
      "text2": "正文2（可选）",
      "text3": "正文3（可选）",
      "quote": "引言（cover 类型）",
      "points": [
        {"title": "小标题", "desc": "描述"}
      ]
    }
  ]
}
```

## 使用方式

```bash
# 使用默认配置（skill目录/poster-config.json）
node .claude/skills/poster-studio/scripts/generate.mjs input.json output-dir/

# 指定配置文件
node .claude/skills/poster-studio/scripts/generate.mjs input.json output-dir/ --config my-config.json
```

## 布局类型

| 类型 | 说明 |
|------|------|
| cover | 封面：大标题 + 引言 + 作者卡片 |
| article | 文章：大标题 + 红色边框卡片 + 正文 |
| steps | 步骤：大号数字 + 标题 + 描述（支持 points 数组） |
| cards | 对比卡片：支持 points 数组动态卡片数 |
| indepth | 深度解析：引言 + 双栏文字 |
| manifesto | 宣言：引用 + 正文 |
| summary | 总结：标题 + 三张交互卡片 |

## 技术特性

- **自定义 CSS**: `googleai-*` 命名空间，Google Fonts (Noto Sans SC, Noto Serif SC, Space Grotesk)
- **随机装饰**: gradient-orb, line, badge, icon（每次生成不同）
- **Playwright 截图**: deviceScaleFactor=1, viewport 2400×3600

## 输出

每个 slide 生成 PNG + HTML 文件。
