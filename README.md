# Poster Studio

Claude Code skill — 生成 2400×3600 长图文海报（抖音图文风格），使用自定义 CSS 模板 + Playwright 截图。

## 示例效果

四种主题色随机生成：

| 橙色 #E17055 | 绿色 #00B894 |
|:---:|:---:|
| ![set-1](examples/set-1.png) | ![set-2](examples/set-2.png) |

| 红色 #FF4B2B | 蓝色 #0984E3 |
|:---:|:---:|
| ![set-3](examples/set-3.png) | ![set-4](examples/set-4.png) |

## 安装

将 `poster-studio` 目录复制到 Claude Code 的 skills 目录：

```bash
cp -r poster-studio ~/.claude/skills/
```

依赖 Playwright（用于截图）：

```bash
npm install playwright
npx playwright install chromium
```

## 配置

编辑 `poster-config.json`：

```json
{
  "author": "@你的名字",
  "avatar": "avatar.jpg",
  "brandColors": ["#FF4B2B", "#6C5CE7", "#00B894", "#E17055", "#0984E3"],
  "summaryCards": [
    { "title": "码住干货", "desc": "放进收藏夹\n避免灵感丢失", "icon": "bookmark" },
    { "title": "留下红心", "desc": "如果你觉得\n本期干货有用", "icon": "heart" },
    { "title": "关注作者", "desc": "持续拆解发布\n图文排版体系", "icon": "avatar" }
  ]
}
```

- `avatar`: 头像文件名，相对于配置文件所在目录
- `brandColors`: 主题色数组，每次生成随机选一个，整组海报统一配色
- `summaryCards`: 最后一页（summary）的互动卡片
- `icon`: `bookmark`（书签）、`heart`（红心）、`avatar`（作者头像）

## 使用

### 准备输入 JSON

```json
{
  "topic": "主题名称",
  "slides": [
    {
      "type": "cover",
      "tag": "标签",
      "title": "大标题\\n可换行",
      "quote": "引言文字",
      "slide_number": "01"
    },
    {
      "type": "article",
      "tag": "标签",
      "title": "标题",
      "text1": "正文段落1",
      "text2": "正文段落2",
      "text3": "正文段落3",
      "slide_number": "02"
    }
  ]
}
```

### 命令行

```bash
# 使用默认配置
node scripts/generate.mjs input.json output-dir/

# 指定配置文件
node scripts/generate.mjs input.json output-dir/ --config my-config.json
```

### Claude Code Skill

在 Claude Code 对话中直接使用：

```
/poster-studio
```

## 布局类型

| 类型 | 说明 |
|------|------|
| `cover` | 封面：大标题 + 引言 + 作者卡片 |
| `article` | 文章：大标题 + 红色边框卡片 + 正文 |
| `steps` | 步骤：大号数字 + 标题 + 描述（支持 points 数组） |
| `cards` | 对比卡片：支持 points 数组动态卡片数 |
| `indepth` | 深度解析：引言 + 双栏文字 |
| `manifesto` | 宣言：引用 + 正文 |
| `summary` | 总结：标题 + 三张互动卡片 |

## 技术细节

- **自定义 CSS**: `googleai-*` 命名空间，Google Fonts (Noto Sans SC, Noto Serif SC, Space Grotesk)
- **随机主题色**: 从 `brandColors` 随机选取，自动派生完整配色（背景、强调色、渐变等）
- **随机装饰**: gradient-orb, line, badge, icon（每次生成不同）
- **Playwright 截图**: viewport 2400×3600, deviceScaleFactor=1

## 输出

每个 slide 生成 PNG + HTML 文件到指定输出目录。

## License

MIT
