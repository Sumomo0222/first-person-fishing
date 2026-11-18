'use strict';
/* ══════════════════════════════════════════════════════
   湖边钓鱼 · 第一人称沉浸钓场
   纯前端：状态机驱动 抛竿 → 等待 → 咬钩 → 收线 → 渔获
   鱼竿/鱼线/手部剪影由 rAF 每帧重绘；时光五阶段轮转
   ══════════════════════════════════════════════════════ */

/* ---------- 数据：时光五阶段 ---------- */
const PHASES = [
  { id: 'dawn',     name: '清晨湖面', icon: '🌅', tip: '薄雾还没散，湖面刚刚醒。点「抛竿」，开始今天第一竿。' },
  { id: 'noon',     name: '正午晴湖', icon: '☀️', tip: '日光把湖水晒得发亮，鱼口变少了，也变急了。' },
  { id: 'dusk',     name: '黄昏风起', icon: '🌇', tip: '西风掠过湖面，晚霞把浮漂染成暖橘色。' },
  { id: 'twilight', name: '暮蓝星升', icon: '🌆', tip: '第一颗星亮起来，湖把整个天空收进了水里。' },
  { id: 'night',    name: '月光时刻', icon: '🌙', tip: '月亮铺下一条银路，浮漂像一粒不肯睡的灯。' },
];

const RARITY = {
  common: { name: '常见', weight: 44, cls: 'r-common' },
  scarce: { name: '少见', weight: 26, cls: 'r-scarce' },
  rare:   { name: '稀有', weight: 20, cls: 'r-rare' },
  legend: { name: '传说', weight: 10, cls: 'r-legend' },
};

/* ---------- 数据：奇妙渔获 ---------- */
const STAR = 'M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8 Z';

const CATCHES = [
  {
    id: 'silver', no: '01', name: '银鳞小鱼', rarity: 'common',
    phases: ['dawn', 'noon', 'dusk'],
    record: '一把银光在掌心跳，掂了掂，又放回湖里。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M42 32 L58 21 L54.5 32 L58 43 Z" fill="#a9bccb"/><ellipse cx="29" cy="32" rx="19" ry="10.5" fill="#dce6ee"/><path d="M29 42.5 Q19 39 13.5 32.5 Q24 35 29 42.5 Z" fill="#c3d1dd"/><path d="M25 22.5 Q29.5 15.5 37 18.5 L31.5 25 Z" fill="#b6c6d4"/><path d="M27 39.5 Q31 44.5 37 43 L33.5 37.5 Z" fill="#c3d1dd"/><path d="M38 27 Q44 29.5 42.5 34.5" fill="none" stroke="#b6c4d2" stroke-width="1.6" stroke-linecap="round"/><circle cx="17.5" cy="30" r="2.3" fill="#25313e"/><circle cx="18.2" cy="29.3" r="0.8" fill="#fff"/></svg>`,
  },
  {
    id: 'blue', no: '02', name: '蓝鳞鱼', rarity: 'common',
    phases: ['noon', 'dusk'],
    record: '鳞片蓝得像正午的湖，晃一眼，凉快半刻。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M42 32 L58 22 L55 32 L58 42 Z" fill="#2c6496"/><ellipse cx="29" cy="32" rx="19" ry="10.5" fill="#3f83bd"/><path d="M30 26 q4 3 0 6 M36 25 q4 3 0 6 M42 27 q4 3 0 6" fill="none" stroke="#8cc3e8" stroke-width="1.5"/><path d="M25 22.5 Q29.5 15.5 37 18.5 L31.5 25 Z" fill="#356f9f"/><path d="M27 40 Q31 45 37 43.5 L33.5 38 Z" fill="#356f9f"/><circle cx="17.5" cy="30" r="2.6" fill="#10243a"/><circle cx="18.3" cy="29.2" r="0.9" fill="#fff"/></svg>`,
  },
  {
    id: 'star', no: '03', name: '星星鱼', rarity: 'rare',
    phases: ['twilight', 'night'],
    record: '鳞缝里漏出细碎星光，盯久了，是它先眨的眼。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="32" r="21" fill="#3a3a72" opacity=".28"/><path d="M42 32 L57 22 L54 32 L57 42 Z" fill="#26305e"/><ellipse cx="29" cy="32" rx="18.5" ry="10.5" fill="#323f7a"/><path d="M25 22.5 Q29.5 15.5 37 18.5 L31.5 25 Z" fill="#2a3568"/><path d="M27 40 Q31 45 37 43.5 L33.5 38 Z" fill="#2a3568"/><g fill="#ffd873"><path d="${STAR}" transform="translate(26 28)"/><path d="${STAR}" transform="translate(37 35) scale(0.7)"/><path d="${STAR}" transform="translate(23 37) scale(0.5)"/></g><circle cx="42" cy="27" r="1.2" fill="#fff"/><circle cx="17.5" cy="30" r="2.4" fill="#0e1a3a"/><circle cx="18.3" cy="29.2" r="0.8" fill="#fff"/></svg>`,
  },
  {
    id: 'shell', no: '04', name: '月亮贝壳', rarity: 'rare',
    phases: ['night'],
    record: '壳里浮着一轮小小的满月，是涨潮那晚捡到的。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="52" rx="18" ry="3.4" fill="#20244a" opacity=".18"/><path d="M32 10 Q12 20 11 33 Q11 47 32 54 Q53 47 53 33 Q52 20 32 10 Z" fill="#ece4f2" stroke="#d3c6e4" stroke-width="1.5"/><path d="M32 13 L32 52 M32 13 L20 50 M32 13 L44 50 M32 13 L14 40 M32 13 L50 40" fill="none" stroke="#d8cbe6" stroke-width="1.3"/><path d="M38 24 A9 9 0 1 0 38 42 A7 7 0 1 1 38 24 Z" fill="#f6d878"/><circle cx="27" cy="29" r="1.4" fill="#fff" opacity=".95"/></svg>`,
  },
  {
    id: 'jelly', no: '05', name: '发光水母', rarity: 'rare',
    phases: ['twilight', 'night'],
    record: '它自己提着灯，把浮漂照成了一粒琥珀。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="26" r="17" fill="#dff4ff" opacity=".35"/><path d="M14 33 Q14 12 32 12 Q50 12 50 33 Q46 37 42 32.5 Q38 37 32 33 Q26 37 22 32.5 Q18 37 14 33 Z" fill="#a8ddf2" stroke="#d6f0fb" stroke-width="1.4"/><path d="M20 36 q4 7 -1 12 t0 10 M28 37 q4 8 -1 13 t1 9 M36 37 q-3 8 2 13 t-1 9 M44 36 q-4 7 1 12 t0 10" fill="none" stroke="#c4e9f8" stroke-width="2" stroke-linecap="round"/><circle cx="26" cy="22" r="1.6" fill="#fff"/><circle cx="34" cy="19" r="1.2" fill="#fff"/><circle cx="31" cy="26" r="1" fill="#fff" opacity=".8"/></svg>`,
  },
  {
    id: 'bottle', no: '06', name: '漂流瓶', rarity: 'common',
    phases: ['dawn', 'noon', 'dusk'],
    record: '瓶里的纸条被湖水泡开了，只认出一个「钓」字。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M27 14 h10 v9 q6 3 6 10 v16 q0 6 -6 6 h-10 q-6 0 -6 -6 v-16 q0 -7 6 -10 Z" fill="#bfe3d4" opacity=".78" stroke="#8fc0ac" stroke-width="1.5"/><rect x="25.5" y="9" width="13" height="7" rx="2" fill="#b08a5e"/><rect x="28" y="32" width="9" height="16" rx="1.5" transform="rotate(-10 32 40)" fill="#f2e6c8"/><path d="M30 36.5 l7 -1 M30 39.5 l7 -1" stroke="#c9b68a" stroke-width="1.2" fill="none"/><path d="M22.5 47 q4.7 3 9.5 0 t9.5 0" fill="none" stroke="#8fd0bc" stroke-width="1.5"/><path d="M30 18 l3 4" stroke="#fff" stroke-width="1.4" opacity=".7" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'ticket', no: '07', name: '旧船票', rarity: 'scarce',
    phases: ['dawn', 'dusk'],
    record: '班次和码头都被水晕开了——反正风知道去哪儿。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-8 32 32)"><rect x="9" y="23" width="46" height="19" rx="2.5" fill="#ecd9a4" stroke="#cdb887" stroke-width="1.4"/><line x1="14" y1="23" x2="14" y2="42" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.5 2.5"/><line x1="50" y1="23" x2="50" y2="42" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.5 2.5"/><rect x="19" y="27.5" width="17" height="2.2" rx="1.1" fill="#bda877"/><rect x="19" y="32" width="23" height="2.2" rx="1.1" fill="#cdbb90"/><rect x="38" y="26.5" width="8" height="8" fill="none" stroke="#c05a4a" stroke-width="1.2"/><circle cx="33" cy="38" r="2.2" fill="#c05a4a" opacity=".85"/></g></svg>`,
  },
  {
    id: 'box', no: '08', name: '小木箱', rarity: 'scarce',
    phases: ['noon', 'twilight'],
    record: '锁早就锈死了，摇一摇，里面有硬糖的声响。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="33" cy="53" rx="21" ry="3.2" fill="#20244a" opacity=".16"/><path d="M13 30 L20 21 L57 21 L51 30 Z" fill="#bd8b5c"/><rect x="13" y="30" width="38" height="21" rx="1.5" fill="#a8784a" stroke="#7c5433" stroke-width="1.4"/><path d="M13 37.5 h38 M13 44.5 h38" stroke="#8f6640" stroke-width="1.2"/><rect x="29" y="21" width="6" height="30" fill="#98a0aa"/><circle cx="32" cy="24" r="0.9" fill="#5f666e"/><circle cx="32" cy="48" r="0.9" fill="#5f666e"/><rect x="28.5" y="33" width="7" height="8" rx="1.5" fill="#e2bd62" stroke="#a8863a" stroke-width="1.2"/><circle cx="32" cy="36.5" r="1.1" fill="#7a5c22"/></svg>`,
  },
  {
    id: 'stone', no: '09', name: '许愿石', rarity: 'legend',
    phases: ['night'],
    record: '贴着它许愿的那一秒，整片湖都替你亮了一下。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="49" rx="17" ry="3.5" fill="#20244a" opacity=".2"/><path d="M12 38 Q12 22 30 20 Q50 18 53 33 Q55 45 38 47.5 Q19 50 12 38 Z" fill="#aca8ca" stroke="#8b87b0" stroke-width="1.4"/><path d="M24 36 q6 -8 13 -3 q5 4 -1 7 q-4 2 -5 -2" fill="none" stroke="#eae2f8" stroke-width="1.8" stroke-linecap="round"/><path d="M40 24 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" fill="#fff"/><circle cx="20" cy="28" r="1" fill="#fff" opacity=".7"/></svg>`,
  },
  {
    id: 'radio', no: '10', name: '旧电台', rarity: 'legend',
    phases: ['dusk', 'night'],
    record: '沙沙声里，放着一首谁也没听过的湖边情歌。',
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="53" rx="24" ry="3" fill="#20244a" opacity=".16"/><line x1="46" y1="24" x2="55" y2="10" stroke="#5f4630" stroke-width="1.8" stroke-linecap="round"/><circle cx="55.5" cy="9.5" r="1.5" fill="#5f4630"/><rect x="9" y="25" width="46" height="26" rx="5" fill="#8a5a3a" stroke="#5f3d28" stroke-width="1.6"/><rect x="14" y="30" width="15" height="16" rx="2" fill="#6b452c"/><path d="M16.5 33 h10 M16.5 37 h10 M16.5 41 h10" stroke="#8f6a48" stroke-width="1.3"/><rect x="33" y="30" width="17" height="8" rx="2" fill="#ecdfbd" stroke="#a8926a" stroke-width="1.1"/><line x1="41" y1="31" x2="41" y2="37" stroke="#c0392b" stroke-width="1.4"/><path d="M35 31 v2 M45 31 v2 M48 31 v2" stroke="#a8926a" stroke-width="1"/><circle cx="38" cy="44.5" r="3" fill="#d8c9a2" stroke="#8a744e" stroke-width="1.1"/><circle cx="46" cy="44.5" r="3" fill="#d8c9a2" stroke="#8a744e" stroke-width="1.1"/><circle cx="13" cy="17" r="1.8" fill="#f4e8c8"/><path d="M14.6 16.5 v-5 q2.5 -1 3.5 1" fill="none" stroke="#f4e8c8" stroke-width="1.5"/></svg>`,
  },
];

const MISS_ART = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="36" r="8" fill="none" stroke="#8aa6b8" stroke-width="2.4" opacity=".85"/><circle cx="32" cy="36" r="16" fill="none" stroke="#8aa6b8" stroke-width="2" opacity=".5"/><circle cx="32" cy="36" r="24" fill="none" stroke="#8aa6b8" stroke-width="1.6" opacity=".28"/></svg>`;

/* ---------- 工具 ---------- */
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (u) => u * u * (3 - 2 * u);
const easeOutQ = (u) => 1 - (1 - u) * (1 - u);
const D2R = Math.PI / 180;
const lerp = (a, b, u) => a + (b - a) * u;

/* ---------- 存档 ---------- */
const SAVE_KEY = 'lakeside-fishing-v1';
const save = { collected: {}, phase: 0 };
(function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        save.collected = (d.collected && typeof d.collected === 'object') ? d.collected : {};
        save.phase = clamp(d.phase | 0, 0, PHASES.length - 1);
      }
    }
  } catch (e) { /* 私密模式等场景忽略 */ }
})();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

/* ---------- 合成音效（WebAudio，无外部资源） ---------- */
let AC = null;
function ensureAudio() {
  try {
    if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); }
    if (AC && AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function tone(f0, f1, dur, vol, type, delay) {
  try {
    if (!AC) return;
    const t = AC.currentTime + (delay || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + dur + 0.05);
  } catch (e) {}
}
const sfx = {
  cast()  { tone(240, 420, 0.14, 0.06, 'triangle'); tone(420, 300, 0.1, 0.05, 'triangle', 0.14); },
  plop()  { tone(520, 150, 0.18, 0.16); },
  nibble(){ tone(430, 230, 0.09, 0.07); },
  bite()  { tone(680, 190, 0.13, 0.16); tone(680, 190, 0.13, 0.12, 'sine', 0.16); },
  reel()  { tone(230, 330, 0.1, 0.06, 'triangle'); tone(255, 355, 0.1, 0.05, 'triangle', 0.12); tone(280, 380, 0.1, 0.045, 'triangle', 0.24); },
  chime() { tone(523, 523, 0.22, 0.1); tone(784, 784, 0.32, 0.1, 'sine', 0.18); },
  miss()  { tone(300, 130, 0.42, 0.08); },
};

/* ---------- DOM 引用 ---------- */
const rigSvg = $('rigSvg'), rodBase = $('rodBase'), rodTip = $('rodTip'), linePath = $('linePath'), handsG = $('handsG');
const floatEl = $('float'), biteMark = $('biteMark'), fx = $('fx');
const mainBtn = $('mainBtn'), statusText = $('statusText');
const timeIcon = $('timeIcon'), timeName = $('timeName');
const modal = $('modal'), modalCard = $('modalCard');
const cardRarity = $('cardRarity'), cardArt = $('cardArt'), cardNo = $('cardNo'),
      cardName = $('cardName'), cardPhase = $('cardPhase'), cardRecord = $('cardRecord'), cardActions = $('cardActions');
const dex = $('dex'), dexGrid = $('dexGrid'), dexCount = $('dexCount'),
      dexProgressText = $('dexProgressText'), dexBarFill = $('dexBarFill');
const toastEl = $('toast');

/* ---------- 钓组几何 ---------- */
let W = 0, H = 0;
let PX = 0, PY = 0;              // 持竿点（画面右下）
let RODLEN = 1, ANG0 = 0;        // 竿长与静息角
let TARGET = { x: 0, y: 0 };     // 浮漂落点（水面）

function computeGeo() {
  W = innerWidth; H = innerHeight;
  rigSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const mobile = W < 640;
  PX = W * (mobile ? 0.9 : 0.885);
  PY = H * 0.965;
  const rest = { x: W * (mobile ? 0.44 : 0.52), y: H * 0.30 };
  RODLEN = Math.hypot(rest.x - PX, rest.y - PY);
  ANG0 = Math.atan2(rest.y - PY, rest.x - PX);
  TARGET = { x: W * (mobile ? 0.385 : 0.455), y: H * 0.545 };
  drawHands();
  if (floatMode === 'water') floatBase = { ...TARGET };
}

/* 手部剪影 + 渔轮（持竿姿势，随尺寸重建） */
function drawHands() {
  const dx = Math.cos(ANG0), dy = Math.sin(ANG0);
  const nx = -dy, ny = dx;
  const at = (d, n) => ({ x: PX + dx * d + nx * n, y: PY + dy * d + ny * n });
  const gripHi = at(RODLEN * 0.13, 14);
  const gripLo = at(RODLEN * 0.055, 12);
  const elbHi = { x: PX + W * 0.07, y: PY + H * 0.10 };
  const elbLo = { x: PX + W * 0.135, y: PY + H * 0.16 };
  const reel = at(RODLEN * 0.095, 22);
  const fistR = Math.max(11, W * 0.0115);
  let s = '';
  s += `<line class="hand-l" x1="${elbHi.x}" y1="${elbHi.y}" x2="${gripHi.x}" y2="${gripHi.y}"/>`;
  s += `<line class="hand-l" x1="${elbLo.x}" y1="${elbLo.y}" x2="${gripLo.x}" y2="${gripLo.y}"/>`;
  s += `<circle class="hand-f" cx="${gripHi.x}" cy="${gripHi.y}" r="${fistR}"/>`;
  s += `<circle class="hand-f" cx="${gripLo.x}" cy="${gripLo.y}" r="${fistR * 1.08}"/>`;
  s += `<circle class="reel" cx="${reel.x}" cy="${reel.y}" r="${Math.max(8, W * 0.0085)}"/>`;
  s += `<circle class="reel-dot" cx="${reel.x + nx * 11}" cy="${reel.y + ny * 11}" r="3"/>`;
  handsG.innerHTML = s;
}

function qPoint(x0, y0, cx, cy, x1, y1, u) {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return { x: a * x0 + b * cx + c * x1, y: a * y0 + b * cy + c * y1 };
}

/* ---------- 游戏状态 ---------- */
let state = 'idle';        // idle | casting | waiting | bite | reeling | landing | escape
let floatMode = 'off';     // off | fly | water | reel
let castAt = 0, launchAt = 0, landAt = 0, launched = false;
let flyFrom = { x: 0, y: 0 }, flightDur = 880;
let floatBase = { x: 0, y: 0 }, floatPos = { x: 0, y: 0 };
let nibbleTimes = [], biteAt = Infinity, biteEnd = Infinity, biteSfx = false;
let reelAt = 0, reelFrom = { x: 0, y: 0 }, reelDur = 880, reelEmpty = false;
let flyAt = 0, pendingCatch = null, escapeAt = 0;
let modalOpen = false, currentCatch = null;

/* ---------- 环境装饰 ---------- */
function buildAmbient() {
  let s = '';
  for (let i = 0; i < 110; i++) {
    s += `<i style="left:${rand(0, 100).toFixed(1)}%;top:${rand(0, 40).toFixed(1)}%;width:${rand(1, 2.3).toFixed(1)}px;height:${rand(1, 2.3).toFixed(1)}px;animation-duration:${rand(2.4, 5.5).toFixed(1)}s;animation-delay:-${rand(0, 6).toFixed(1)}s"></i>`;
  }
  $('stars').innerHTML = s;

  let f = '';
  for (let i = 0; i < 8; i++) {
    f += `<i style="left:${rand(4, 92).toFixed(0)}%;top:${rand(56, 86).toFixed(0)}%;animation-delay:-${rand(0, 10).toFixed(1)}s,-${rand(0, 2.5).toFixed(1)}s;animation-duration:${rand(9, 14).toFixed(1)}s,2.6s"></i>`;
  }
  $('fireflies').innerHTML = f;

  let k = '';
  for (let i = 0; i < 26; i++) {
    k += `<i style="left:${rand(2, 94).toFixed(1)}%;top:${rand(46, 72).toFixed(1)}%;width:${rand(10, 30).toFixed(0)}px;animation-delay:-${rand(0, 4).toFixed(1)}s;animation-duration:${rand(3, 5.5).toFixed(1)}s"></i>`;
  }
  $('sparkles').innerHTML = k;
}

/* ---------- 时光阶段 ---------- */
function applyPhase() {
  const p = PHASES[save.phase];
  document.body.className = 'phase-' + p.id;
  timeIcon.textContent = p.icon;
  timeName.textContent = p.name;
}

/* ---------- HUD / UI ---------- */
function setUI() {
  const busy = state === 'casting' || state === 'reeling' || state === 'landing';
  /* 等待期可点击（过急收线→空竿）；抛竿/收线动画中不可点 */
  mainBtn.disabled = !(state === 'idle' || state === 'waiting' || state === 'bite');
  mainBtn.classList.toggle('urgent', state === 'bite');
  mainBtn.innerHTML =
    state === 'idle'    ? '🎣 抛竿' :
    state === 'casting' ? '抛竿中…' :
    state === 'waiting' ? '静候鱼汛…' :
    state === 'bite'    ? '❗ 收线！' :
    state === 'reeling' ? '收线中…' :
    state === 'landing' ? '收鱼！' : '🎣 抛竿';
  if (state === 'idle') statusText.textContent = PHASES[save.phase].tip;
  else if (state === 'casting') statusText.textContent = '甩竿——鱼线在空中划出一道弧线。';
  else if (state === 'waiting') statusText.textContent = '浮漂落定了，盯着它最细微的颤动…';
  else if (state === 'bite') statusText.textContent = '浮漂猛地下沉——就是现在，收线！';
  else if (state === 'reeling') statusText.textContent = reelEmpty ? '收线……这次什么也没有。' : '线绷紧了，水下的力气不小……';
  else if (state === 'landing') statusText.textContent = '出水了——看看这次钓到了什么！';
}

let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1900);
}

function updateDexHUD() {
  const n = Object.keys(save.collected).length;
  dexCount.textContent = `${n}/${CATCHES.length}`;
}

/* ---------- 水面特效 ---------- */
function ripple(x, y, scale, delay) {
  const el = document.createElement('i');
  el.className = 'ripple';
  const s = 58 * (scale || 1);
  el.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s * 0.36}px;margin-left:${-s / 2}px;margin-top:${-s * 0.18}px;`;
  fx.appendChild(el);
  el.animate(
    [{ transform: 'scale(.25)', opacity: .85 }, { transform: 'scale(1.9)', opacity: 0 }],
    { duration: 1150, delay: delay || 0, easing: 'cubic-bezier(.2,.6,.4,1)' }
  ).onfinish = () => el.remove();
}
function splash(x, y, big) {
  const b = big || 1;
  ripple(x, y, 1); ripple(x, y, 1.5, 110); ripple(x, y, 0.7, 60);
  const n = Math.round(7 * b);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.className = 'drop';
    el.style.left = x + 'px'; el.style.top = y + 'px';
    fx.appendChild(el);
    const dx = rand(-46, 46) * b, dy = rand(-74, -32) * b;
    el.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: .95 },
        { transform: `translate(${dx}px,${dy}px) scale(.9)`, opacity: .85, offset: .45 },
        { transform: `translate(${dx * 1.5}px,${dy + 64}px) scale(.55)`, opacity: 0 },
      ],
      { duration: 620 + rand(0, 180), easing: 'cubic-bezier(.2,.6,.6,1)' }
    ).onfinish = () => el.remove();
  }
  const fl = document.createElement('i');
  fl.className = 'flash';
  fl.style.left = x + 'px'; fl.style.top = y + 'px';
  fx.appendChild(fl);
  fl.animate(
    [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: .55 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 }],
    { duration: 520, easing: 'ease-out' }
  ).onfinish = () => fl.remove();
}

/* ---------- 渔获跃出水面 ---------- */
function spawnCatchFly(artSvg) {
  const el = document.createElement('div');
  el.className = 'catch-fly';
  el.innerHTML = artSvg;
  el.style.left = floatPos.x + 'px';
  el.style.top = floatPos.y + 'px';
  document.body.appendChild(el);
  const dx = (W * 0.5 - floatPos.x) * 0.6;
  const dyUp = -H * 0.20;
  el.animate(
    [
      { transform: 'translate(-50%,-50%) translate(0,0) scale(.35) rotate(-16deg)', opacity: 1, offset: 0 },
      { transform: `translate(-50%,-50%) translate(${dx * 0.5}px,${dyUp}px) scale(.92) rotate(7deg)`, opacity: 1, offset: .58 },
      { transform: `translate(-50%,-50%) translate(${dx}px,${dyUp * 0.72}px) scale(1.06) rotate(-3deg)`, opacity: 1, offset: .88 },
      { transform: `translate(-50%,-50%) translate(${dx}px,${dyUp * 0.66}px) scale(1.02) rotate(0deg)`, opacity: 1, offset: 1 },
    ],
    { duration: 1000, easing: 'cubic-bezier(.22,.7,.35,1)' }
  );
  return el;
}

/* ---------- 主流程 ---------- */
function startCast() {
  state = 'casting';
  castAt = performance.now();
  launchAt = castAt + 430;
  landAt = launchAt + flightDur;
  launched = false;
  floatMode = 'off';
  floatEl.style.opacity = '0';
  sfx.cast();
  setUI();
}

function landFloat() {
  floatMode = 'water';
  floatBase = { ...TARGET };
  floatPos = { ...TARGET };
  splash(TARGET.x, TARGET.y, 1);
  sfx.plop();
  state = 'waiting';
  nibbleTimes = [];
  const wait = rand(1900, 4400);
  biteAt = landFloat._t + wait;
  if (wait > 2600) nibbleTimes.push(landFloat._t + rand(700, wait - 1200));
  biteEnd = biteAt + 1650;
  biteSfx = false;
  setUI();
}

function triggerBite() {
  state = 'bite';
  sfx.bite();
  ripple(floatPos.x, floatPos.y, 1.1);
  biteMark.classList.add('show');
  setUI();
}

function hookIt() {
  state = 'reeling';
  reelEmpty = false;
  reelAt = performance.now();
  reelDur = 880;
  reelFrom = { ...floatPos };
  floatMode = 'reel';
  biteMark.classList.remove('show');
  sfx.reel();
  setUI();
}

function earlyPull() {
  state = 'reeling';
  reelEmpty = true;
  reelAt = performance.now();
  reelDur = 560;
  reelFrom = { ...floatPos };
  floatMode = 'reel';
  toast('太急了——鱼还没咬钩。');
  sfx.reel();
  setUI();
}

function doMiss() {
  state = 'escape';
  escapeAt = performance.now();
  floatMode = 'off';
  floatEl.style.opacity = '0';
  splash(floatPos.x, floatPos.y, 0.8);
  biteMark.classList.remove('show');
  sfx.miss();
  setUI();
}

function finishReel() {
  floatMode = 'off';
  floatEl.style.opacity = '0';
  if (reelEmpty) {
    state = 'idle';
    setUI();
    return;
  }
  state = 'landing';
  flyAt = performance.now();
  splash(floatPos.x, floatPos.y, 1.3);
  sfx.plop();
  pendingCatch = pickCatch();
  const fly = spawnCatchFly(pendingCatch.svg);
  setTimeout(() => fly.remove(), 1500);
  setUI();
}

function pickCatch() {
  const phaseId = PHASES[save.phase].id;
  const pool = CATCHES.filter((c) => c.phases.includes(phaseId));
  const total = pool.reduce((sum, c) => sum + RARITY[c.rarity].weight, 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= RARITY[c.rarity].weight;
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

function openCatchModal() {
  modalOpen = true;
  currentCatch = pendingCatch;
  pendingCatch = null;
  const c = currentCatch, r = RARITY[c.rarity];
  cardRarity.textContent = r.name;
  cardRarity.className = 'card-rarity ' + r.cls;
  cardArt.innerHTML = c.svg;
  cardNo.textContent = 'No.' + c.no;
  cardName.textContent = c.name;
  cardPhase.textContent = '出没于 ' + c.phases.map((id) => PHASES.find((p) => p.id === id).name).join(' · ');
  cardRecord.textContent = '「' + c.record + '」';
  cardActions.innerHTML = '<button id="closeBtn" class="ghost-btn">收好</button><button id="againBtn" class="primary-btn">再钓一次</button>';
  $('closeBtn').addEventListener('click', closeModal);
  $('againBtn').addEventListener('click', () => { closeModal(); autoCast(); });
  if (!save.collected[c.id]) { save.collected[c.id] = Date.now(); persist(); updateDexHUD(); }
  modal.classList.add('show');
  sfx.chime();
}

function openMissModal() {
  modalOpen = true;
  cardRarity.style.display = 'none';
  cardArt.innerHTML = MISS_ART;
  modalCard.classList.add('miss');
  cardNo.textContent = 'No.——';
  cardName.textContent = '鱼儿脱钩了';
  cardPhase.textContent = '一瞬间的重量，变成涟漪散开了';
  cardRecord.textContent = '「湖边的遗憾也值得记录：下一竿会更好。」';
  cardActions.innerHTML = '<button id="retryBtn" class="primary-btn">再抛一竿</button>';
  $('retryBtn').addEventListener('click', () => {
    modal.classList.remove('show');
    modalCard.classList.remove('miss');
    modalOpen = false;
    state = 'idle';
    setUI();
  });
  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
  modalCard.classList.remove('miss');
  cardRarity.style.display = '';
  modalOpen = false;
  /* 每完成一次钓鱼，时间推进到下一阶段 */
  save.phase = (save.phase + 1) % PHASES.length;
  persist();
  applyPhase();
  state = 'idle';
  floatMode = 'off';
  floatEl.style.opacity = '0';
  setUI();
}

function autoCast() {
  if (state !== 'idle' || modalOpen) return;
  setTimeout(() => { if (state === 'idle' && !modalOpen) startCast(); }, 650);
}

/* ---------- 图鉴 ---------- */
function renderDex() {
  const caught = Object.keys(save.collected).length;
  dexProgressText.textContent = `已收集 ${caught} / ${CATCHES.length}`;
  dexBarFill.style.width = (caught / CATCHES.length * 100).toFixed(0) + '%';
  dexGrid.innerHTML = CATCHES.map((c) => {
    const has = !!save.collected[c.id];
    const r = RARITY[c.rarity];
    return `<div class="dex-cell ${has ? 'caught ' + r.cls + '-c' : 'uncaught'}">
      <div class="art">${c.svg}</div>
      <span class="qmark">?</span>
      <div class="nm">${has ? c.name : '？？？'}</div>
      <div class="no">No.${c.no} · ${has ? r.name : '未知'}</div>
    </div>`;
  }).join('');
}

function openDex() {
  if (state !== 'idle') { toast('收竿后再看图鉴吧～'); return; }
  renderDex();
  dex.classList.add('show');
}
function closeDex() { dex.classList.remove('show'); }

/* ---------- 主按钮 ---------- */
mainBtn.addEventListener('click', () => {
  ensureAudio();
  if (state === 'idle') startCast();
  else if (state === 'bite') hookIt();
  else if (state === 'waiting') earlyPull();
});
$('dexBtn').addEventListener('click', () => { ensureAudio(); openDex(); });
$('dexClose').addEventListener('click', closeDex);
dex.addEventListener('click', (e) => { if (e.target === dex) closeDex(); });

/* ---------- 主循环：竿 / 线 / 浮漂 ---------- */
const CAST_BACK = 260, CAST_WHIP = 210, CAST_SETTLE = 720;

function castAngle(tc) {
  if (tc < CAST_BACK) return -10 * easeOutQ(tc / CAST_BACK) * D2R;
  if (tc < CAST_BACK + CAST_WHIP) {
    const u = (tc - CAST_BACK) / CAST_WHIP;
    return (-10 + 27 * u * u) * D2R;
  }
  const u = clamp((tc - CAST_BACK - CAST_WHIP) / CAST_SETTLE, 0, 1);
  return 17 * (1 - easeOutQ(u)) * D2R;
}
function castBend(tc) {
  if (tc < CAST_BACK) return 0.12 + 0.1 * (tc / CAST_BACK);
  if (tc < CAST_BACK + CAST_WHIP) return 0.22 + 0.45 * ((tc - CAST_BACK) / CAST_WHIP);
  return Math.max(0.15, 0.62 - ((tc - CAST_BACK - CAST_WHIP) / 520) * 0.5);
}
function dipAt(t) {
  let d = 0;
  for (const nt of nibbleTimes) {
    const x = (t - nt) / 130;
    d += 8 * Math.exp(-x * x);
  }
  if (state === 'bite') {
    const bx = t - biteAt;
    for (const o of [0, 300, 620]) {
      const x = (bx - o) / 105;
      d += 14 * Math.exp(-x * x);
    }
    if (bx > 620) d += 7;
  }
  return d;
}

let lastTick = 0;
function tick(t) {
  const dt = Math.min(64, t - lastTick || 16);
  lastTick = t;

  /* --- 鱼竿角度与弯曲 --- */
  let angle = ANG0 + (Math.sin(t / 1100) * 1.1 + Math.sin(t / 700) * 0.5) * D2R;
  let bend = 0.14 + Math.sin(t / 900) * 0.04;

  if (state === 'casting') {
    const tc = t - castAt;
    angle = ANG0 + castAngle(tc);
    bend = castBend(tc);
    if (!launched && t >= launchAt) {
      launched = true;
      const tip = tipOf(angle);
      flyFrom = { x: tip.x, y: tip.y };
      floatMode = 'fly';
      floatEl.style.opacity = '1';
    }
    if (launched && t >= landAt) { landFloat._t = t; landFloat(); }
  } else if (state === 'waiting') {
    bend = 0.2;
    if (t >= biteAt) {
      if (!biteSfx) { triggerBite(); biteSfx = true; }
    }
  } else if (state === 'bite') {
    bend = 0.32 + dipAt(t) * 0.012;
    angle += Math.sin(t / 85) * 0.55 * D2R;
    if (t >= biteEnd) doMiss();
  } else if (state === 'reeling') {
    angle = ANG0 + (4.5 + Math.sin(t / 70) * 0.7) * D2R;
    bend = reelEmpty ? 0.3 : 0.72;
  } else if (state === 'landing') {
    const u = clamp((t - flyAt) / 600, 0, 1);
    angle = ANG0 + 4.5 * (1 - u) * D2R;
    bend = 0.72 * (1 - u) + 0.15;
  }

  const tip = tipOf(angle);

  /* --- 浮漂位置 --- */
  if (floatMode === 'fly') {
    const u = smooth(clamp((t - launchAt) / flightDur, 0, 1));
    const apex = {
      x: (flyFrom.x + TARGET.x) / 2,
      y: Math.min(flyFrom.y, TARGET.y) - H * 0.16,
    };
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    floatPos = { x: a * flyFrom.x + b * apex.x + c * TARGET.x, y: a * flyFrom.y + b * apex.y + c * TARGET.y };
  } else if (floatMode === 'water') {
    const dip = dipAt(t);
    floatPos = {
      x: floatBase.x + Math.sin(t / 900) * 2.2 + (state === 'bite' ? Math.sin(t / 95) * 1.6 : 0),
      y: floatBase.y + Math.sin(t / 750) * 2.6 + dip,
    };
  } else if (floatMode === 'reel') {
    const u = smooth(clamp((t - reelAt) / reelDur, 0, 1));
    floatPos = { x: lerp(reelFrom.x, tip.x * 0.985, u), y: lerp(reelFrom.y, tip.y * 0.985, u) };
    if (t >= reelAt + reelDur) finishReel();
  }

  /* --- 渲染浮漂 --- */
  if (floatMode === 'off') {
    floatEl.style.opacity = '0';
    floatPos = { x: tip.x, y: tip.y };
  } else {
    floatEl.style.opacity = '1';
    floatEl.style.left = floatPos.x + 'px';
    floatEl.style.top = floatPos.y + 'px';
    const tilt = (floatMode === 'water' ? dipAt(t) * 1.1 : 0) + Math.sin(t / 640) * 2;
    floatEl.style.transform = `translate(-50%,-50%) rotate(${tilt.toFixed(1)}deg)`;
  }

  /* 咬钩提示位置 */
  if (biteMark.classList.contains('show')) {
    biteMark.style.left = floatPos.x + 'px';
    biteMark.style.top = (floatPos.y - 16) + 'px';
  }

  /* --- 鱼线（竿尖 → 浮漂，带垂度） --- */
  let sag = 26 + Math.sin(t / 650) * 5;
  if (floatMode === 'fly') sag = 10;
  else if (floatMode === 'reel') sag = 3.5;
  else if (state === 'bite') sag = 20;
  const mx = (tip.x + floatPos.x) / 2 + Math.sin(t / 800) * 3;
  const my = (tip.y + floatPos.y) / 2 + sag;
  linePath.setAttribute('d', `M ${tip.x.toFixed(1)} ${tip.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${floatPos.x.toFixed(1)} ${floatPos.y.toFixed(1)}`);

  /* --- 鱼竿（两段式，带弯曲） --- */
  const bow = 10 + bend * 36;
  const cx = (PX + tip.x) / 2 + bow * 0.12;
  const cy = (PY + tip.y) / 2 + bow;
  const p55 = qPoint(PX, PY, cx, cy, tip.x, tip.y, 0.55);
  const p45 = qPoint(PX, PY, cx, cy, tip.x, tip.y, 0.42);
  const buttX = PX + Math.cos(angle + Math.PI) * RODLEN * 0.035;
  const buttY = PY + Math.sin(angle + Math.PI) * RODLEN * 0.035;
  rodBase.setAttribute('d', `M ${buttX.toFixed(1)} ${buttY.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p55.x.toFixed(1)} ${p55.y.toFixed(1)}`);
  rodTip.setAttribute('d', `M ${p45.x.toFixed(1)} ${p45.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`);

  /* --- 脱钩弹窗延迟 --- */
  if (state === 'escape' && !modalOpen && t - escapeAt > 520) openMissModal();
  /* --- 渔获跃出后弹窗 --- */
  if (state === 'landing' && !modalOpen && t - flyAt > 980) openCatchModal();

  requestAnimationFrame(tick);
}

function tipOf(angle) {
  return { x: PX + Math.cos(angle) * RODLEN, y: PY + Math.sin(angle) * RODLEN };
}

/* ---------- 启动 ---------- */
buildAmbient();
applyPhase();
updateDexHUD();
computeGeo();
setUI();
addEventListener('resize', computeGeo);
requestAnimationFrame(tick);
