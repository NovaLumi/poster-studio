#!/usr/bin/env node
/**
 * Poster Studio Generator
 * 使用 poster-templates 原始 CSS + HTML 结构
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, '..');

// ─── 从配置文件读取 ───
const DEFAULT_CONFIG_PATH = join(SKILL_DIR, 'poster-config.json');

function loadConfig(configPath) {
  const resolved = resolve(configPath);
  if (!existsSync(resolved)) {
    console.error(`Config file not found: ${resolved}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(resolved, 'utf-8'));
  // 头像路径：相对于配置文件所在目录
  const configDir = dirname(resolved);
  const avatarPath = raw.avatar ? join(configDir, raw.avatar) : null;
  let avatarB64 = '';
  if (avatarPath && existsSync(avatarPath)) {
    avatarB64 = 'data:image/jpeg;base64,' + readFileSync(avatarPath).toString('base64');
  }
  return {
    author: raw.author || '@Author',
    avatarB64,
    brandColor: raw.brandColor || '#FF4B2B',
    brandColors: Array.isArray(raw.brandColors) && raw.brandColors.length > 0
      ? raw.brandColors
      : [raw.brandColor || '#FF4B2B'],
    summaryCards: raw.summaryCards || [
      { title: '码住干货', desc: '放进收藏夹\n避免灵感丢失', icon: 'bookmark' },
      { title: '留下红心', desc: '如果你觉得\n本期干货有用', icon: 'heart' },
      { title: '关注作者', desc: '持续拆解发布\n图文排版体系', icon: 'avatar' },
    ],
  };
}

// 延迟初始化：main() 中加载
let CONFIG;

// ─── 从品牌色推导完整配色方案 ───
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function derivePalette(hex) {
  const [r, g, b] = hexToRgb(hex);
  // 背景用品牌色混合白色：品牌色 8% + 白色 92%
  const bgMix = (ch) => Math.round(ch * 0.08 + 255 * 0.92);
  const bgMix2 = (ch) => Math.round(ch * 0.12 + 250 * 0.88);
  return {
    accent: hex,
    bg1: `rgb(${bgMix(r)}, ${bgMix(g)}, ${bgMix(b)})`,
    bg2: `rgb(${bgMix2(r)}, ${bgMix2(g)}, ${bgMix2(b)})`,
    // 品牌色渐变条
    grad1: hex,
    grad2: `rgb(${Math.min(255, r + 32)}, ${Math.min(255, g + 32)}, ${Math.min(255, b + 32)})`,
    grad3: `rgb(${Math.max(0, r - 32)}, ${Math.max(0, g - 32)}, ${Math.max(0, b - 32)})`,
    // 半透明品牌色
    accentA08: `rgba(${r},${g},${b},0.08)`,
    accentA10: `rgba(${r},${g},${b},0.10)`,
    accentA15: `rgba(${r},${g},${b},0.15)`,
    accentA05: `rgba(${r},${g},${b},0.05)`,
    accentA30: `rgba(${r},${g},${b},0.30)`,
    accentA50: `rgba(${r},${g},${b},0.50)`,
    accentA60: `rgba(${r},${g},${b},0.60)`,
    // summary card-3 的浅色背景
    cardTint: `rgb(${255}, ${250 - Math.round((255 - g) * 0.25)}, ${250 - Math.round((255 - b) * 0.25)})`,
    // 文字和通用色保持不变
    text: '#2D2825',
    textMuted: 'rgba(45,40,37,0.7)',
    border: 'rgba(45,40,37,0.1)',
    white: '#FFFFFF',
  };
}

// ─── CSS 生成（运行时注入完整配色） ───
function buildCss(P) { return `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
    width: 2400px; height: 3600px;
    font-family: system-ui, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    background: ${P.bg1};
    background: linear-gradient(180deg, ${P.bg1} 0%, ${P.bg2} 100%);
    color: ${P.text};
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
}

.poster {
    width: 2400px; height: 3600px;
    padding: 100px 120px 90px;
    display: flex; flex-direction: column;
    position: relative;
    overflow: hidden;
}

/* content-wrap */
.content-wrap {
    position: absolute;
    top: 100px; bottom: 90px;
    left: 120px; right: 120px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
}
.slide-num-bg {
    position: absolute; top: 20px; right: 40px;
    font-size: 520px; font-weight: 900;
    color: ${P.accentA08};
    line-height: 1; letter-spacing: -14px;
    user-select: none; pointer-events: none;
}

/* ── Google AI Studio 奶油风 ── */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&family=Noto+Serif+SC:wght@200;400;600;900&family=Noto+Sans+SC:wght@100;300;400;500;700;900&display=swap');

.poster { background: ${P.bg1}; font-family: 'Noto Sans SC', sans-serif; position: relative; overflow: hidden; }
.poster::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, ${P.grad1}, ${P.grad2}, ${P.grad3});
}

/* 装饰层 */
.googleai-deco-layer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
.googleai-deco-orb { position: absolute; border-radius: 50%; filter: blur(200px); transform: translate(-50%, -50%); }

/* Header */
.googleai-header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 120px; z-index: 20; position: relative; }
.googleai-header-tag { font-family: 'Noto Sans SC', sans-serif; font-size: 50px; font-weight: 700; letter-spacing: 0.15em; padding: 16px 32px; border-radius: 20px; color: ${P.bg1}; background: ${P.text}; }
.googleai-header-right { display: flex; align-items: center; gap: 48px; }
.googleai-header-author { font-family: 'Noto Sans SC', sans-serif; font-size: 50px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.55; mix-blend-mode: difference; color: ${P.text}; }
.googleai-header-pagenum { font-family: 'Space Grotesk', sans-serif; font-size: 66px; font-weight: 700; letter-spacing: 0.15em; display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.05); padding: 24px 32px; border-radius: 40px; color: ${P.text}; }
.googleai-pagenum-dot { width: 16px; height: 16px; border-radius: 50%; background: ${P.accent}; }

/* Cover Layout */
.googleai-cover { position: relative; width: 100%; height: 100%; padding: 160px; padding-top: 200px; display: flex; flex-direction: column; justify-content: space-between; }
.googleai-cover-main { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 10; }
.googleai-cover-tag { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; font-weight: 700; letter-spacing: 0.15em; padding: 20px 40px; border-radius: 40px; background: ${P.accent}; color: ${P.white}; display: inline-flex; align-items: center; gap: 24px; margin-bottom: 100px; box-shadow: 0 20px 60px -15px ${P.accentA50}; border: 1px solid rgba(0,0,0,0.05); }
.googleai-cover-cta-arrow { width: 64px; height: 64px; }
.googleai-cover-title { font-family: 'Noto Serif SC', serif; font-size: 300px; font-weight: 900; line-height: 1.25; letter-spacing: -0.02em; white-space: pre-line; word-break: keep-all; color: ${P.text}; margin-bottom: 120px; position: relative; z-index: 10; }
.googleai-cover-quote { font-family: 'Noto Sans SC', sans-serif; font-size: 66px; line-height: 1.8; letter-spacing: 0.1em; max-width: 1700px; font-weight: 300; text-align: justify; padding-left: 60px; border-left: 16px solid ${P.border}; color: ${P.textMuted}; }
.googleai-cover-brand { position: absolute; right: 0; top: 50%; transform: translateY(-50%) rotate(12deg); width: 800px; height: 800px; border-radius: 120px; background: ${P.accent}; opacity: 0.05; mix-blend-mode: multiply; pointer-events: none; }
.googleai-cover-footer { position: relative; z-index: 10; border-top: 4px solid ${P.border}; padding-top: 80px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.4); backdrop-filter: blur(20px); padding: 48px; border-radius: 60px; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.15); }
.googleai-cover-author-box { display: flex; align-items: center; gap: 40px; }
.googleai-cover-avatar { width: 140px; height: 140px; border-radius: 40px; background: ${P.text}; color: ${P.bg1}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 58px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
.googleai-cover-author-info { display: flex; flex-direction: column; gap: 8px; }
.googleai-cover-author-name { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; font-weight: 700; color: ${P.text}; }
.googleai-cover-author-desc { font-family: 'Noto Sans SC', sans-serif; font-size: 50px; letter-spacing: 0.1em; color: ${P.textMuted}; }
.googleai-cover-cta { display: flex; align-items: center; gap: 24px; background: ${P.accent}; color: ${P.white}; padding: 32px 48px; border-radius: 100px; box-shadow: 0 30px 60px -15px ${P.accentA60}; }
.googleai-cover-cta-text { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; font-weight: 700; letter-spacing: 0.1em; }

/* Article Layout */
.googleai-article { position: relative; width: 100%; height: 100%; padding: 160px; display: flex; flex-direction: column; }
.googleai-article-title { font-family: 'Noto Serif SC', serif; font-size: 200px; font-weight: 900; line-height: 1.15; white-space: pre-line; color: ${P.text}; margin-bottom: 120px; z-index: 10; position: relative; }
.googleai-article-body { flex: 1; display: flex; flex-direction: column; gap: 80px; z-index: 10; }
.googleai-article-card { background: ${P.white}; border-radius: 60px; padding: 80px; position: relative; overflow: hidden; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.15); }
.googleai-article-card-accent { position: absolute; top: 0; left: 0; width: 24px; height: 100%; background: ${P.accent}; }
.googleai-article-card-text { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; line-height: 1.8; font-weight: 500; opacity: 0.9; text-align: justify; padding-left: 48px; }
.googleai-article-text { font-family: 'Noto Sans SC', sans-serif; font-size: 54px; line-height: 1.9; text-align: justify; font-weight: 300; color: ${P.textMuted}; }

/* Steps Layout */
.googleai-steps { position: relative; width: 100%; height: 100%; padding: 160px; display: flex; flex-direction: column; }
.googleai-steps-title { font-family: 'Noto Serif SC', serif; font-size: 200px; font-weight: 900; line-height: 1.2; color: ${P.text}; margin-bottom: 80px; z-index: 10; position: relative; }
.googleai-steps-intro { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; line-height: 1.8; margin-bottom: 100px; text-align: justify; border-left: 12px solid ${P.border}; padding-left: 60px; color: ${P.textMuted}; z-index: 10; position: relative; }
.googleai-steps-list { flex: 1; display: flex; flex-direction: column; gap: 60px; z-index: 10; }
.googleai-step-item { display: flex; gap: 80px; padding: 80px; border-radius: 50px; background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); border: 2px solid ${P.border}; }
.googleai-step-num { font-family: 'Space Grotesk', sans-serif; font-size: 160px; font-weight: 900; line-height: 0.8; width: 180px; color: ${P.accent}; flex-shrink: 0; }
.googleai-step-content { flex: 1; }
.googleai-step-title { font-family: 'Noto Sans SC', sans-serif; font-size: 66px; font-weight: 700; line-height: 1.3; color: ${P.text}; margin-bottom: 40px; }
.googleai-step-desc { font-family: 'Noto Sans SC', sans-serif; font-size: 54px; line-height: 1.8; font-weight: 300; text-align: justify; color: ${P.textMuted}; }

/* Cards Layout */
.googleai-cards { position: relative; width: 100%; height: 100%; padding: 160px; display: flex; flex-direction: column; }
.googleai-cards-title { font-family: 'Noto Serif SC', serif; font-size: 240px; font-weight: 900; line-height: 1.1; color: ${P.text}; margin-bottom: 120px; position: relative; display: inline-block; z-index: 10; }
.googleai-cards-title-bg { position: absolute; bottom: 0; left: 0; width: 100%; height: 60px; background: ${P.accent}; opacity: 0.3; z-index: -1; }
.googleai-cards-grid { flex: 1; display: flex; flex-direction: column; gap: 80px; z-index: 10; }
.googleai-card-item { padding: 100px; border-radius: 60px; display: flex; flex-direction: column; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.1); border: 4px solid ${P.white}; background: ${P.white}; }
.googleai-card-item-b { border: 4px dashed ${P.border}; background: transparent; box-shadow: none; }
.googleai-card-label { display: flex; align-items: center; gap: 24px; font-family: 'Space Grotesk', sans-serif; font-size: 66px; font-weight: 900; text-transform: uppercase; color: ${P.accent}; margin-bottom: 60px; }
.googleai-card-item-b .googleai-card-label { color: ${P.textMuted}; }
.googleai-card-label-square { width: 48px; height: 48px; }
.googleai-card-text { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; line-height: 1.8; text-align: justify; font-weight: 300; }

/* In-Depth Layout */
.googleai-indepth { position: relative; width: 100%; height: 100%; padding: 160px; display: flex; flex-direction: column; }
.googleai-indepth-header { z-index: 10; margin-bottom: 100px; }
.googleai-indepth-quote-icon { width: 128px; height: 128px; color: ${P.accent}; margin-bottom: 60px; }
.googleai-indepth-title { font-family: 'Noto Serif SC', serif; font-size: 200px; font-weight: 900; line-height: 1.1; white-space: pre-line; color: ${P.text}; }
.googleai-indepth-body { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; padding-top: 80px; border-top: 8px solid ${P.border}; z-index: 10; }
.googleai-indepth-col-text { font-family: 'Noto Sans SC', sans-serif; font-size: 54px; line-height: 1.9; text-align: justify; color: ${P.textMuted}; }
.googleai-indepth-bottom { width: 100%; margin-top: 80px; padding: 80px; background: ${P.white}; border-radius: 40px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); z-index: 10; }
.googleai-indepth-bottom-text { font-family: 'Noto Sans SC', sans-serif; font-size: 58px; line-height: 1.8; font-weight: 500; text-align: justify; }

/* Manifesto Layout */
.googleai-manifesto { position: relative; width: 100%; height: 100%; padding: 160px; display: flex; flex-direction: column; }
.googleai-manifesto-main { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 10; }
.googleai-manifesto-quote-mark { font-family: 'Noto Serif SC', serif; font-size: 600px; line-height: 0.7; font-weight: 900; opacity: 0.03; position: absolute; top: -100px; left: -40px; color: ${P.text}; user-select: none; pointer-events: none; }
.googleai-manifesto-title { font-family: 'Noto Sans SC', sans-serif; font-size: 180px; font-weight: 900; line-height: 1.1; white-space: pre-line; padding-left: 80px; border-left: 32px solid ${P.accent}; letter-spacing: -0.01em; }
.googleai-manifesto-body { margin-top: 120px; display: flex; flex-direction: column; gap: 80px; }
.googleai-manifesto-text-main { font-family: 'Noto Serif SC', serif; font-size: 66px; line-height: 1.8; text-align: justify; padding-left: 80px; font-weight: 500; white-space: pre-line; }
.googleai-manifesto-text-sub { font-family: 'Noto Sans SC', sans-serif; font-size: 54px; line-height: 1.85; text-align: justify; padding-left: 80px; font-weight: 300; color: ${P.textMuted}; white-space: pre-line; }

/* Summary Layout */
.googleai-summary { position: relative; width: 100%; height: 100%; padding: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.googleai-summary-title { font-family: 'Noto Serif SC', serif; font-size: 240px; font-weight: 900; line-height: 1.15; white-space: pre-line; color: ${P.text}; margin-bottom: 100px; position: relative; z-index: 10; }
.googleai-summary-intro { font-family: 'Noto Sans SC', sans-serif; font-size: 66px; line-height: 1.8; font-weight: 300; max-width: 1700px; opacity: 0.8; margin-bottom: 200px; text-align: justify; position: relative; z-index: 10; }
.googleai-summary-cards { display: flex; gap: 48px; width: 100%; justify-content: center; position: relative; z-index: 10; }
.googleai-summary-card { flex: 1; max-width: 700px; padding: 100px; border-radius: 80px; display: flex; flex-direction: column; align-items: center; gap: 40px; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.15); position: relative; overflow: hidden; }
.googleai-summary-card-icon { width: 160px; height: 160px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2); }
.googleai-summary-card-title { font-family: 'Noto Sans SC', sans-serif; font-size: 74px; font-weight: 700; margin-top: 24px; }
.googleai-summary-card-desc { font-family: 'Noto Sans SC', sans-serif; font-size: 54px; font-weight: 300; text-align: center; line-height: 1.6; }
.googleai-summary-card-1 { background: ${P.white}; }
.googleai-summary-card-1 .googleai-summary-card-icon { background: #FFD700; color: #222; }
.googleai-summary-card-2 { background: ${P.white}; }
.googleai-summary-card-2 .googleai-summary-card-icon { background: ${P.accent}; color: #FFF; }
.googleai-summary-card-3 { background: ${P.cardTint}; color: ${P.text}; border: none; }
.googleai-summary-card-3 .googleai-summary-card-icon { background: ${P.accent}; }
.googleai-summary-card-3 .googleai-summary-card-desc { color: ${P.textMuted}; }
.googleai-summary-interact { position: absolute; bottom: 60px; right: 60px; display: flex; flex-direction: column; align-items: flex-end; gap: 24px; opacity: 0.6; }
.googleai-summary-interact-text { font-family: 'Noto Sans SC', sans-serif; font-size: 50px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; }
.googleai-summary-interact-arrow { width: 80px; height: 80px; transform: rotate(90deg); }

/* Bottom Safe Zone */
.googleai-safe-zone { width: 100%; height: 120px; flex-shrink: 0; pointer-events: none; }

/* SVG Icons */
.svg-icon { display: inline-flex; align-items: center; justify-content: center; width: 1em; height: 1em; vertical-align: middle; }
.svg-icon svg { width: 100%; height: 100%; }
.tag .svg-icon { width: 0.9em; height: 0.9em; }
`;
}

// ─── HTML 模板 ───

function wrapHtml(bodyContent, css) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=2400, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
<div class="poster">
    <div class="googleai-deco-layer">
        ${generateDecorations()}
    </div>
${bodyContent}
    <div class="googleai-safe-zone"></div>
</div>
</body>
</html>`;
}

// 通用：嵌入本地图片为 base64
let _inputDir = '.';
function embedImage(filePath) {
  const absPath = resolve(_inputDir, filePath);
  if (!existsSync(absPath)) {
    console.warn(`[WARN] Image not found: ${absPath}`);
    return `<div style="padding:40px;border:2px dashed #ccc;color:#999;text-align:center;border-radius:16px;">图片未找到: ${filePath}</div>`;
  }
  const ext = filePath.split('.').pop().toLowerCase();
  const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
  const mime = mimeMap[ext] || 'image/png';
  const b64 = readFileSync(absPath).toString('base64');
  return `<img src="data:${mime};base64,${b64}" style="width:100%;border-radius:16px;display:block;" />`;
}

// 预处理文本中的 {{img:路径}} 占位符
function preprocessText(text) {
  if (!text) return text;
  return text.replace(/\{\{img:(.+?)\}\}/g, (_, path) => embedImage(path.trim()));
}

// 通用：按 \n 切割文本为多个块
function splitParagraphs(text, cssClass) {
  if (!text) return '';
  const processed = preprocessText(text);
  const parts = processed.split('\n').filter(p => p.trim());
  if (parts.length <= 1) return `<div class="${cssClass}">${processed}</div>`;
  return parts.map(p => `<div class="${cssClass}">${p}</div>`).join('\n            ');
}

// Cover 模板
function generateCover(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题').replace(/\n/g, '<br>');
  const quote = escapeHtml(slide.quote || slide.text1 || '引言内容');
  const pageNumStr = String(pageNum).padStart(2, '0');

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${pageNumStr} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-cover">
        <div class="googleai-cover-main">
            <div class="googleai-cover-title">${title}</div>
            ${splitParagraphs(quote, 'googleai-cover-quote')}
            <div class="googleai-cover-brand"></div>
        </div>
        <div class="googleai-cover-footer">
            <div class="googleai-cover-author-box">
                <img src="${CONFIG.avatarB64}" style="width:140px;height:140px;border-radius:40px;object-fit:cover;">
                <div class="googleai-cover-author-info">
                    <div class="googleai-cover-author-name">${CONFIG.author}</div>
                </div>
            </div>
        </div>
    </div>`;
}

// Article 模板
function generateArticle(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题').replace(/\n/g, '<br>');
  const text1 = escapeHtml(slide.text1 || '');
  const text2 = escapeHtml(slide.text2 || '');
  const text3 = escapeHtml(slide.text3 || '');

  const pageNumStr = String(pageNum).padStart(2, '0');

  let cardHtml = '';
  if (text1) {
    cardHtml += `<div class="googleai-article-card"><div class="googleai-article-card-accent"></div>${splitParagraphs(text1, 'googleai-article-card-text')}</div>`;
  }

  let extraText = '';
  if (text2) {
    extraText += splitParagraphs(text2, 'googleai-article-text');
  }
  if (text3) {
    extraText += splitParagraphs(text3, 'googleai-article-text');
  }

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${pageNumStr} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-article">
        <h2 class="googleai-article-title">${title}</h2>
        <div class="googleai-article-body">
            ${cardHtml}
            ${extraText}
        </div>
    </div>`;
}

// Steps 模板
function generateSteps(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题');
  const text1 = escapeHtml(slide.text1 || '');
  const points = slide.points || [];

  const pageNumStr = String(pageNum).padStart(2, '0');

  let stepsHtml = '';
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const num = String(i + 1).padStart(2, '0');
    stepsHtml += `
            <div class="googleai-step-item">
                <div class="googleai-step-num">${num}</div>
                <div class="googleai-step-content">
                    <div class="googleai-step-title">${escapeHtml(p.title || '')}</div>
                    <div class="googleai-step-desc">${escapeHtml(p.desc || '')}</div>
                </div>
            </div>`;
  }

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${pageNumStr} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-steps">
        <h2 class="googleai-steps-title">${title}</h2>
        ${splitParagraphs(text1, 'googleai-steps-intro')}
        <div class="googleai-steps-list">
            ${stepsHtml}
        </div>
    </div>`;
}

// Cards 模板 — 支持 points 数组（动态卡片）和 text1/text2（2张卡片）
function generateCards(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题').replace(/\n/g, '<br>');
  const pageNumStr = String(pageNum).padStart(2, '0');

  const labels = ['A', 'B', 'C', 'D', 'E'];
  const icons = [
    '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>',
    '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>',
    '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>',
    '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  ];

  let cardsHtml = '';

  if (slide.points && slide.points.length > 0) {
    slide.points.forEach((p, i) => {
      const cardTitle = escapeHtml(p.title || '');
      const cardDesc = escapeHtml(p.desc || '');
      cardsHtml += `
            <div class="googleai-card-item">
                <div class="googleai-card-label">
                    ${icons[i % icons.length]}
                    ${cardTitle}
                </div>
                <div class="googleai-card-text">${cardDesc}</div>
            </div>`;
    });
  } else {
    const text1 = escapeHtml(slide.text1 || '');
    const text2 = escapeHtml(slide.text2 || '');
    cardsHtml = `
            <div class="googleai-card-item">
                <div class="googleai-card-label">
                    ${icons[0]}
                    Concept A.
                </div>
                ${splitParagraphs(text1, 'googleai-card-text')}
            </div>
            <div class="googleai-card-item googleai-card-item-b">
                <div class="googleai-card-label">
                    ${icons[1]}
                    Concept B.
                </div>
                ${splitParagraphs(text2, 'googleai-card-text')}
            </div>`;
  }

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${pageNumStr} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-cards">
        <div class="googleai-cards-title">${title}<div class="googleai-cards-title-bg"></div></div>
        <div class="googleai-cards-grid">
${cardsHtml}
        </div>
    </div>`;
}

// InDepth 模板
function generateInDepth(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题').replace(/\n/g, '<br>');
  const text1 = escapeHtml(slide.text1 || '');
  const text2 = escapeHtml(slide.text2 || '');
  const text3 = escapeHtml(slide.text3 || '');

  const pageNumStr = String(pageNum).padStart(2, '0');

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${pageNumStr} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-indepth">
        <div class="googleai-indepth-header">
            <svg class="svg-icon googleai-indepth-quote-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path></svg>
            <h2 class="googleai-indepth-title">${title}</h2>
        </div>
        <div class="googleai-indepth-body">
            ${splitParagraphs(text1, 'googleai-indepth-col-text')}
            ${splitParagraphs(text2, 'googleai-indepth-col-text')}
        </div>
        ${text3 ? `<div class="googleai-indepth-bottom">${splitParagraphs(text3, 'googleai-indepth-bottom-text')}</div>` : ''}
    </div>`;
}

// Manifesto 模板
function generateManifesto(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题').replace(/\n/g, '<br>');
  const text1 = escapeHtml(slide.text1 || '');
  const text2 = escapeHtml(slide.text2 || '');

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-manifesto">
        <div class="googleai-manifesto-main">
            <div class="googleai-manifesto-quote-mark">"</div>
            <div class="googleai-manifesto-title">${title}</div>
            <div class="googleai-manifesto-body">
                ${text1.split('\n').map(p => `<div class="googleai-manifesto-text-main">${p}</div>`).join('\n                ')}
                ${text2 ? text2.split('\n').map(p => `<div class="googleai-manifesto-text-sub">${p}</div>`).join('\n                ') : ''}
            </div>
        </div>
    </div>`;
}

// Summary 模板
function generateSummary(slide, pageNum, totalPages) {
  const tag = escapeHtml(slide.tag || '标签');
  const title = escapeHtml(slide.title || '标题').replace(/\n/g, '<br>');
  const text1 = escapeHtml(slide.text1 || '');
  const pageNumStr = String(pageNum).padStart(2, '0');

  return `    <div class="googleai-header">
        <div class="googleai-header-tag">${tag}</div>
        <div class="googleai-header-right">
            <div class="googleai-header-author">${CONFIG.author}</div>
            <div class="googleai-header-pagenum">
                <span class="googleai-pagenum-dot"></span>
                ${pageNumStr} / ${String(totalPages).padStart(2, '0')}
            </div>
        </div>
    </div>
    <div class="googleai-summary">
        <h2 class="googleai-summary-title">${title}</h2>
        ${splitParagraphs(text1, 'googleai-summary-intro')}
        <div class="googleai-summary-cards">
            <div class="googleai-summary-card googleai-summary-card-1">
                <div class="googleai-summary-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="80" height="80"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                </div>
                <div class="googleai-summary-card-title">码住干货</div>
                <div class="googleai-summary-card-desc">放进收藏夹<br/>避免灵感丢失</div>
            </div>
            <div class="googleai-summary-card googleai-summary-card-2">
                <div class="googleai-summary-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="80" height="80"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>
                </div>
                <div class="googleai-summary-card-title">留下红心</div>
                <div class="googleai-summary-card-desc">如果你觉得<br/>本期干货有用</div>
            </div>
            <div class="googleai-summary-card googleai-summary-card-3">
                <div class="googleai-summary-card-icon">
                    <img src="${CONFIG.avatarB64}" style="width:160px;height:160px;border-radius:50%;object-fit:cover;">
                </div>
                <div class="googleai-summary-card-title">关注作者</div>
                <div class="googleai-summary-card-desc">持续拆解发布<br/>图文排版体系</div>
            </div>
        </div>
    </div>`;
}

// ─── 随机装饰生成 ───
const BADGE_SYMBOLS = ['+', '×', '///', '—', '✱', '"', '✦'];
const SPARKLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`;
const QUOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/></svg>`;

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }

function generateDecorations() {
  const decos = [];
  const count = rand(3, 5);

  for (let i = 0; i < count; i++) {
    const type = ['orb', 'orb', 'line', 'badge', 'icon'][rand(0, 4)];

    if (type === 'orb') {
      const size = rand(600, 1800);
      decos.push(`<div class="googleai-deco-orb" style="width:${size}px;height:${size}px;top:${rand(-5,105)}%;left:${rand(-5,105)}%;background:${CONFIG.brandColor};opacity:${randFloat(0.03,0.10)};"></div>`);
    } else if (type === 'line') {
      const isV = Math.random() > 0.5;
      if (isV) {
        decos.push(`<div style="position:absolute;top:0;left:${rand(10,90)}%;width:2px;height:100%;background-color:#2D2825;opacity:${randFloat(0.03,0.08)};pointer-events:none;"></div>`);
      } else {
        decos.push(`<div style="position:absolute;left:0;top:${rand(10,90)}%;height:2px;width:100%;background-color:#2D2825;opacity:${randFloat(0.03,0.08)};pointer-events:none;"></div>`);
      }
    } else if (type === 'badge') {
      const sym = BADGE_SYMBOLS[rand(0, BADGE_SYMBOLS.length - 1)];
      const rot = rand(-45, 45);
      decos.push(`<div style="position:absolute;top:${rand(10,80)}%;left:${rand(10,80)}%;font-size:${rand(150,350)}px;font-family:'Space Grotesk',sans-serif;font-weight:900;color:#2D2825;opacity:0.04;transform:translate(-50%,-50%) rotate(${rot}deg);pointer-events:none;user-select:none;">${sym}</div>`);
    } else if (type === 'icon') {
      const svg = Math.random() > 0.5 ? SPARKLE_SVG : QUOTE_SVG;
      const size = rand(100, 280);
      decos.push(`<div style="position:absolute;top:${rand(10,80)}%;left:${rand(10,80)}%;width:${size}px;height:${size}px;color:#2D2825;opacity:${randFloat(0.03,0.08)};transform:translate(-50%,-50%);pointer-events:none;">${svg}</div>`);
    }
  }

  return decos.join('\n        ');
}

// ─── 辅助函数 ───
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 主生成器 ───
function generateSlide(slide, pageNum, totalPages, css) {
  const type = slide.type || 'article';
  let body = '';

  switch (type) {
    case 'cover':
      body = generateCover(slide, pageNum, totalPages);
      break;
    case 'manifesto':
      body = generateManifesto(slide, pageNum, totalPages);
      break;
    case 'steps':
      body = generateSteps(slide, pageNum, totalPages);
      break;
    case 'indepth':
      body = generateInDepth(slide, pageNum, totalPages);
      break;
    case 'cards':
      body = generateCards(slide, pageNum, totalPages);
      break;
    case 'article':
      body = generateArticle(slide, pageNum, totalPages);
      break;
    case 'summary':
      body = generateSummary(slide, pageNum, totalPages);
      break;
    default:
      body = generateArticle(slide, pageNum, totalPages);
  }

  return wrapHtml(body, css);
}

// ─── Playwright 图片导出（与 generate_posters.py 完全一致） ───
async function captureFromHtml(htmlContents, outputDir, slideMetas) {
  const { chromium } = await import('playwright');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 2400, height: 3600 },
    deviceScaleFactor: 1,
  });

  for (let i = 0; i < htmlContents.length; i++) {
    const html = htmlContents[i];
    const meta = slideMetas[i] || {};
    const slideNum = meta.slide_number || String(i + 1).padStart(2, '0');
    const slideType = meta.type || 'content';
    const filename = `slide_${slideNum}_${slideType}.png`;
    const filepath = join(outputDir, filename);

    // 同时保存 HTML
    const htmlPath = join(outputDir, `slide_${slideNum}_${slideType}.html`);
    writeFileSync(htmlPath, html, 'utf-8');

    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: filepath, fullPage: false });
    await page.close();

    console.log(`[OK] ${filename}`);
  }

  await browser.close();
  console.log(`\n[DONE] Exported ${htmlContents.length} images to ${outputDir}`);
}

// ─── CLI ───
async function main() {
  const args = process.argv.slice(2);

  // 解析参数
  let inputPath = null;
  let outputDir = null;
  let configPath = DEFAULT_CONFIG_PATH;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      configPath = args[++i];
    } else if (!inputPath) {
      inputPath = args[i];
    } else if (!outputDir) {
      outputDir = args[i];
    }
  }

  if (!inputPath || !outputDir) {
    console.log('Usage: node generate.mjs <input.json> <output-dir/> [--config poster-config.json]');
    console.log('');
    console.log('Options:');
    console.log('  --config <path>  配置文件路径 (默认: skill目录/poster-config.json)');
    process.exit(1);
  }

  // 加载配置
  CONFIG = loadConfig(configPath);
  const brandColor = CONFIG.brandColors[Math.floor(Math.random() * CONFIG.brandColors.length)];
  CONFIG.brandColor = brandColor;
  const palette = derivePalette(brandColor);
  const CSS = buildCss(palette);
  console.log(`[CONFIG] author: ${CONFIG.author}, avatar: ${CONFIG.avatarB64 ? 'yes' : 'no'}, theme: ${brandColor}`);

  // 读取输入
  _inputDir = dirname(resolve(inputPath));
  let data;
  try {
    const inputContent = readFileSync(inputPath, 'utf-8');
    data = JSON.parse(inputContent);
  } catch (e) {
    console.error(`Error reading input file: ${e.message}`);
    process.exit(1);
  }

  const slides = data.slides || [];
  const totalPages = slides.length;

  // 生成 HTML 列表
  const htmlContents = [];
  const slideMetas = [];

  slides.forEach((slide, index) => {
    const pageNum = index + 1;
    const html = generateSlide(slide, pageNum, totalPages, CSS);
    htmlContents.push(html);
    slideMetas.push({
      slide_number: String(pageNum).padStart(2, '0'),
      type: slide.type || 'article',
    });
  });

  // 直接截图生成 PNG（与 generate_posters.py 一致）
  await captureFromHtml(htmlContents, outputDir, slideMetas);
}

main().catch(console.error);
