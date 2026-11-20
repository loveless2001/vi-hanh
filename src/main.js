import {
  TILE, COLS, ROWS, MAP, WALKABLE, START, NPCS, TALKS, DEBATES, ECHO, VERDICTS,
} from './data.js';
import { CH2, ALLY, BOSS, VERDICTS2 } from './chapter2.js';
import { NPCS3, FAMILY_LINE, CH3, MAKER, MACHINE, EDGE, FINALE, VERDICTS3 } from './chapter3.js';

import { RITES, SCRIBE, round2, ROUND2_TEXT, round2Verdict, DEMO_LEGACY, BLANK_LEGACY } from './extras.js';
import { CAST, facePlayer } from './characters.js';

NPCS[3] = NPCS3;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Băm chuỗi thành số, dùng để xáo thứ tự một cách cố định
const mix = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };

const state = {
  chapter: 1,
  busy: true,
  log: [],            // id của các ECHO chương 1, theo thứ tự xảy ra
  log2: [],           // như trên, cho chương 2
  log3: [],           // và chương 3
  log4: [],           // vòng hai
  scribed: {},        // id ECHO chương 1 -> { text, delta }: chữ bạn khắc lên thẻ tre
  rite: { sides: new Set(), field: 0 },
  legacy: null,       // di sản của lượt trước, khi chơi vòng hai
  hasMachine: false,  // Máy đang đi theo bạn
  machineTalks: 0,
  edgeKnown: false,   // đã chạm mép giấy
  glued: false,       // đã tự tay dán hai mép
  flipped: false,     // đang ở mặt bên kia của dải giấy
  crossed: false,
  talked: new Set(),  // id NPC đã nói chuyện
  debates: {},        // id -> { tries, usedA:Set, asserted, resolved }
};

let scene = null;

// ───────────────────────── Bàn phím ─────────────────────────

const DIRS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};
const isAction = (e) => e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE';
const held = new Set();
let keyHandler = null; // khi UI đang chờ, mọi phím đi vào đây

window.addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (keyHandler) { keyHandler(e); return; }
  held.add(e.code);
  if (e.repeat || state.busy) return;
  if (isAction(e)) interact();
  else if (e.code === 'KeyL') showRawLog();
  else if (e.code === 'KeyM' && state.hasMachine) callMachine();
});
window.addEventListener('keyup', (e) => held.delete(e.code));
window.addEventListener('blur', () => held.clear());

// ───────────────────────── UI: hội thoại ─────────────────────────

const dialog = $('dialog');

function showSpeaker(who) {
  $('d-who').textContent = who || '';
  const npc = scene?.npcs.find((n) => n.name === who);
  const frame = who === 'Bạn' ? (state.chapter === 4 ? CAST.c_ti : CAST.c_player) : npc?.sprite.frame.name;
  const portrait = $('d-portrait');
  portrait.hidden = frame == null;
  dialog.scrollTop = 0;
  if (portrait.hidden) return;
  const art = scene.textures.getFrame('cast', frame);
  const ctx = portrait.getContext('2d');
  ctx.clearRect(0, 0, portrait.width, portrait.height);
  ctx.drawImage(art.source.image, art.cutX, art.cutY, art.cutWidth, art.cutHeight, 0, 0, 32, 32);
}

function say(who, text) {
  return new Promise((resolve) => {
    held.clear();
    dialog.hidden = false;
    showSpeaker(who);
    $('d-text').textContent = text || '';
    $('d-choices').innerHTML = '';
    $('d-more').hidden = false;
    const done = () => { keyHandler = null; dialog.onclick = null; resolve(); };
    keyHandler = (e) => { if (!e.repeat && isAction(e)) done(); };
    dialog.onclick = done;
  });
}

async function sayAll(lines) {
  for (const [who, text] of lines) await say(who, text);
}

function choose(who, text, options) {
  return new Promise((resolve) => {
    held.clear();
    dialog.hidden = false;
    dialog.onclick = null;
    showSpeaker(who);
    $('d-text').textContent = text || '';
    $('d-more').hidden = true;
    const box = $('d-choices');
    box.innerHTML = '';
    box.classList.toggle('compact', options.length >= 6);
    let sel = 0;
    const buttons = options.map((o, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<span class="num">${i + 1}</span>${esc(o.label)}`
        + (o.hint ? `<span class="hint">${esc(o.hint)}</span>` : '');
      b.onclick = (ev) => { ev.stopPropagation(); pick(i); };
      b.onmouseenter = () => { sel = i; paint(); };
      box.appendChild(b);
      return b;
    });
    const paint = () => {
      buttons.forEach((b, i) => b.classList.toggle('sel', i === sel));
      buttons[sel].scrollIntoView({ block: 'nearest' });
    };
    const pick = (i) => { keyHandler = null; box.innerHTML = ''; resolve(i); };
    paint();
    keyHandler = (e) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { sel = (sel + 1) % options.length; paint(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { sel = (sel + options.length - 1) % options.length; paint(); }
      else if (!e.repeat && isAction(e)) pick(sel);
      else if (/^(Digit|Numpad)[1-9]$/.test(e.code)) {
        const i = Number(e.code.slice(-1)) - 1;
        if (i < options.length) pick(i);
      }
    };
  });
}

function closeDialog() {
  dialog.hidden = true;
  document.activeElement?.blur?.();
}

function screen(html, btn = 'Tiếp tục') {
  return new Promise((resolve) => {
    held.clear();
    const el = $('screen');
    const list = Array.isArray(btn) ? btn : [btn];
    const btnsHtml = list.length === 1
      ? `<button id="scr-btn">${esc(list[0])} ⏎</button>`
      : `<div class="scr-btns">${list.map((b, i) => `<button data-i="${i}" id="${i === 0 ? 'scr-btn' : `scr-btn-${i}`}">${esc(b)}${i === 0 ? ' ⏎' : ''}</button>`).join('')}</div>`;
    el.innerHTML = `${html}${btnsHtml}`;
    el.hidden = false;
    el.scrollTop = 0;
    const buttons = [...el.querySelectorAll('.scr-btns button, #scr-btn')];
    let sel = 0;
    const paint = () => {
      if (list.length <= 1) return;
      buttons.forEach((b, i) => {
        b.classList.toggle('sel', i === sel);
        b.textContent = `${list[i]}${i === sel ? ' ⏎' : ''}`;
      });
    };
    const done = (i = sel) => { keyHandler = null; el.hidden = true; document.activeElement?.blur?.(); resolve(i); };
    paint();
    buttons.forEach((b, i) => {
      b.onclick = () => done(i);
      b.onmouseenter = () => { sel = i; paint(); };
    });
    keyHandler = (e) => {
      const logEl = el.querySelector('.log');
      if (list.length > 1 && (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
        const step = (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'ArrowDown' || e.code === 'KeyS') ? 1 : list.length - 1;
        sel = (sel + step) % list.length;
        paint();
      } else if (logEl && (e.code === 'ArrowDown' || e.code === 'KeyS')) {
        logEl.scrollTop += 48;
      } else if (logEl && (e.code === 'ArrowUp' || e.code === 'KeyW')) {
        logEl.scrollTop -= 48;
      } else if (!e.repeat && (e.code === 'Enter' || e.code === 'Space')) {
        done(sel);
      } else if (list.length > 1 && /^(Digit|Numpad)[1-9]$/.test(e.code)) {
        const i = Number(e.code.slice(-1)) - 1;
        if (i < list.length) done(i);
      }
    };
  });
}

// ───────────────────────── Log Vũ Trụ ─────────────────────────

const curLog = () => [null, state.log, state.log2, state.log3, state.log4][state.chapter];
function pushLog(id) { if (!curLog().includes(id)) curLog().push(id); }
// Chắc Chắn của một dòng log, kể cả phần cộng trừ do thẻ tre khắc còn ý hay mất ý
const ccOf = (id) => Math.max(0, ECHO[id].cc + (state.scribed[id]?.delta ?? 0));
const totalCertainty = (list) => list.reduce((n, id) => n + ccOf(id), 0);
// Lời đầu tiên bạn để lại ở chương 1 về một chủ đề (thunder, ti, pond, lanh)
const firstEcho = (topic) => state.log.find((id) => id.startsWith(`${topic}.`));

const LOG_SUBS = [
  '',
  'Những gì bạn đã để lại ở thị trấn này. Chưa ai chép lại, nhưng rồi sẽ có.',
  'Những gì bạn để lại lần này. Lần trước đã thành kinh. Lần này cũng đang có người chép.',
  'Những gì bạn và Máy để lại lần này. Giờ người ta chép cả lời Máy.',
  'Bạn là trẻ con. Sổ làng chỉ ghi việc người lớn thấy bạn làm.',
];

let toastTimer = 0;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4200);
}

// Việc bạn vô tình làm ở chương 1 mà có người nhìn thấy
function rite(key) {
  const id = `rite.${key}`;
  if (state.chapter !== 1 || state.log.includes(id)) return;
  state.log.push(id);
  toast('Có người vừa thấy bạn làm thế. Đã ghi vào Log Vũ Trụ.');
}

async function showRawLog() {
  state.busy = true;
  const items = curLog().map((id) => {
    const e = ECHO[id];
    return `<div class="e"><div class="verb">${esc(e.verb)}</div><div class="said">“${esc(e.said)}”</div></div>`;
  }).join('');
  await screen(
    `<h2>Log Vũ Trụ</h2><p class="sub">${esc(LOG_SUBS[state.chapter])}</p>`
    + (items ? `<div class="log">${items}</div>` : '<p>Trống. Bạn chưa nói gì đáng chép.</p>'),
    'Đóng',
  );
  state.busy = false;
}

function certaintyVerdict(list, verdicts) {
  const total = totalCertainty(list);
  return verdicts.find((v) => total <= v.max).text;
}

function echoLogHtml(list, title, verdict) {
  const items = list.map((id) => {
    const e = ECHO[id];
    const sc = state.scribed[id];
    return `<div class="e">
      <div class="verb">${esc(e.verb)}</div>
      <div class="said">“${esc(e.said)}”</div>
      ${sc ? `<div class="tre">Thẻ tre khắc: “${esc(sc.text)}” · ${sc.delta < 0 ? 'còn ý' : 'mất ý'}</div>` : ''}
      <div class="now">${esc(id === 'edge.assert' && list.includes('edge.glue') ? EDGE.assertThenGlue : e.now)}</div>
      <div class="cc">Chắc Chắn +${ccOf(id)}</div>
    </div>`;
  }).join('');
  const total = totalCertainty(list);
  return `<h2>${esc(title)}</h2>
    <div class="log">${items}</div>
    <div class="total">Tổng Chắc Chắn của thị trấn: ${total}</div>
    <p>${esc(verdict)}</p>`;
}

// ───────────────────────── Tranh biện ─────────────────────────

function debateState(id) {
  return (state.debates[id] ??= { tries: 0, usedA: new Set(), asserted: false, resolved: null });
}

function drawBattle(d, cc, pat, note) {
  $('b-name').textContent = d.doctrine;
  $('b-pat-key').textContent = d.patLabel ?? 'Kiên Nhẫn';
  $('b-cc-bar').style.width = `${clamp((cc / d.certainty) * 100, 0, 100)}%`;
  $('b-cc-num').textContent = cc;
  $('b-pat').innerHTML = Array.from({ length: d.patience }, (_, i) => `<i class="${i < pat ? '' : 'off'}"></i>`).join('');
  $('b-note').textContent = note;
}

async function runDebate(npc, d, st) {
  let cc = d.certainty;
  let pat = d.patience;
  let note = d.note ?? 'Mỗi câu hỏi tốn một chấm Kiên Nhẫn. Người làng sẽ chép lại lời bạn khẳng định.';
  const usedQ = new Set();
  $('battle').hidden = false;

  while (cc > 0) {
    drawBattle(d, cc, pat, note);
    // Xáo thứ tự câu hỏi (cố định theo từng cuộc) để vị trí trong danh sách không lộ câu nào hay
    const qs = d.questions.map((q, i) => ({ q, i, k: mix(d.id + q.label) }))
      .sort((a, b) => a.k - b.k).filter((o) => !usedQ.has(o.i));
    const as = d.needsMachine && !state.hasMachine ? [] : d.assertions.filter((a) => !st.usedA.has(a.echo));

    const menu = [];
    if (pat > 0 && qs.length) menu.push({ k: 'q', label: 'Hỏi', hint: d.askHint ?? 'tốn 1 Kiên Nhẫn' });
    if (as.length) menu.push({ k: 'a', label: d.assertLabel ?? 'Khẳng định', hint: d.assertHint ?? `−${d.assertDmg} Chắc Chắn, và người ta sẽ chép lại` });
    menu.push({ k: 'l', label: 'Bỏ đi' });
    const prompt = pat > 0 ? 'Bạn làm gì?' : (d.outPrompt ?? 'Bạn hết kiên nhẫn để hỏi tiếp.');
    const m = menu[await choose('', prompt, menu)];

    if (m.k === 'l') {
      await sayAll(d.leave);
      $('battle').hidden = true;
      return;
    }

    if (m.k === 'q') {
      const i = await choose('Bạn hỏi', '', [...qs.map((o) => ({ label: o.q.label })), { label: '← Quay lại' }]);
      if (i === qs.length) continue;
      const { q, i: qi } = qs[i];
      usedQ.add(qi);
      pat -= 1;
      cc = clamp(cc - q.dmg, 0, d.certainty + 3);
      note = q.dmg > 0 ? `Chắc Chắn −${q.dmg}` : `Chắc Chắn +${-q.dmg}. Đấy là khẳng định đội lốt câu hỏi.`;
      drawBattle(d, cc, pat, note);
      await say(npc.name, q.reply);
    } else {
      const i = await choose(d.assertPrompt ?? 'Bạn khẳng định', '', [...as.map((a) => ({ label: a.label })), { label: '← Quay lại' }]);
      if (i === as.length) continue;
      const a = as[i];
      st.usedA.add(a.echo);
      st.asserted = true;
      pushLog(a.echo);
      st.lastAssertion = a;
      if (a.via) await say(...a.via);
      const dmg = a.dmg ?? d.assertDmg;
      cc = clamp(cc - dmg, 0, d.certainty + 3);
      note = `Chắc Chắn ${dmg > 0 ? `−${dmg}` : `+${-dmg}`}. Đã ghi vào Log Vũ Trụ.`;
      drawBattle(d, cc, pat, note);
      await say(npc.name, a.reply);
    }
  }

  drawBattle(d, 0, pat, 'Giáo điều sụp đổ.');
  // questionsOnly: khẳng định không bao giờ hạ được giáo điều này, nên thắng luôn là thắng bằng câu hỏi
  st.resolved = st.asserted && !d.questionsOnly ? 'a' : 'q';
  if (st.resolved === 'q') pushLog(d.echoQ);
  await sayAll(st.resolved === 'a' ? (st.lastAssertion?.winA ?? d.winA) : d.winQ);
  $('battle').hidden = true;
}

// ───────────────────────── Chương 2: dựng giáo điều từ lời chương 1 ─────────────────────────

const TOPICS = ['ti', 'pond', 'lanh'];
const SEAM_ROWS = [6, 7, 8]; // các hàng có mép giấy; đối xứng qua hàng giữa để dán xoắn vẫn khớp
const ch2Cache = {};

// Con cháu đọc lại đúng mấy chữ bạn đã khắc
const scribedLine = (who, id) => (state.scribed[id] ? [[who, `Thẻ tre nhà tôi khắc lời Thầy thế này: “${state.scribed[id].text}”.`]] : []);

function ch2Debate(id) {
  const c = CH2[id];
  if (!c) return null;
  if (ch2Cache[id]) return ch2Cache[id];

  const who = NPCS[2].find((n) => n.topic === id.split('.')[0]).name;
  const tablet = state.scribed[id]?.text ?? ECHO[id].said.replace(/[.,]/g, '');
  const name = c.doctrine;
  const ownLabel = c.ownLabel ?? 'Chính ta là người nói câu đó.';
  const retractLabel = c.retractLabel ?? 'Ta rút lại lời ấy.';
  Object.assign(ECHO, {
    [`${id}.fall`]: {
      verb: 'Bạn chỉ hỏi', said: `Giáo điều ‘${name}’ tự đổ.`, cc: 0,
      now: 'Họ thôi tin, và không lập ra cái gì thay thế. Đám Đấng Sáng Tạo kiểm tra hai lần vì tưởng log lỗi.',
    },
    [`${id}.own`]: {
      verb: 'Bạn khẳng định', said: ownLabel, cc: 3,
      now: c.ownLegacy ?? `Kinh ghi thêm: Thầy đã hiện về và nhận “${name}” là lời mình. Giáo điều này từ nay có chữ ký.`,
    },
    [`${id}.retract`]: {
      verb: 'Bạn khẳng định', said: retractLabel, cc: 3,
      now: c.retractLegacy ?? `“Thầy rút lại” được chép thành phụ lục của “${name}”. Phụ lục dày hơn bản chính, bìa cũng vàng, cũng cấm sửa.`,
    },
    [`${id}.stand`]: {
      verb: 'Bạn bỏ đi', said: `Giáo điều ‘${name}’ còn nguyên.`, cc: ECHO[id].cc,
      now: 'Nó có thêm ba thế hệ tuổi đời, nên càng đúng.',
    },
  });

  return (ch2Cache[id] = {
    id,
    doctrine: name,
    certainty: c.certainty + (state.scribed[id]?.delta ?? 0),
    patience: c.patience,
    assertDmg: 5,
    intro: [[who, ECHO[id].line], ...scribedLine(who, id), [who, c.intro2]],
    again: [[who, 'Lại ông. Lệ vẫn thế.']],
    questions: c.questions.map((q) => q.readTablet ? { ...q, reply: q.readTablet(tablet) } : q),
    assertions: [
      { label: ownLabel, echo: `${id}.own`, reply: c.own },
      { label: retractLabel, echo: `${id}.retract`, reply: c.retract },
    ],
    winQ: c.winQ.map((t) => [who, t]),
    winA: c.winA.map((t) => [who, t]),
    leave: [[who, c.leave]],
    after: { q: c.afterQ, a: c.afterA },
    echoQ: `${id}.fall`,
  });
}

// Giáo điều chương 2 của một chủ đề, nếu lời chương 1 của bạn đã thành giáo điều
const enemyOf = (topic) => { const id = firstEcho(topic); return id && CH2[id] ? id : null; };

// Người chịu đứng cạnh bạn trước trùm: con cháu của người bạn chỉ hỏi, hoặc người vừa tự bỏ giáo điều
function witnesses() {
  return TOPICS.filter((t) => {
    const id = firstEcho(t);
    if (!id) return false;
    return CH2[id] ? state.debates[id]?.resolved === 'q' : true;
  });
}

function bossDef(who) {
  const w = witnesses();
  const standing = TOPICS.filter((t) => { const id = enemyOf(t); return id && !state.debates[id]?.resolved; }).length;
  const spoken = state.log2.filter((id) => /\.(own|retract)$/.test(id) && id !== 'boss.own').length;
  const legacy = totalCertainty(state.log.filter((id) => id.startsWith('thunder.')));  // đã tính cả thẻ tre
  const parts = [`nền 5`, `chuyện sấm ngày xưa +${legacy}`];
  if (standing) parts.push(`giáo điều còn đứng +${standing * 2}`);
  if (spoken) parts.push(`lời bạn vừa phán +${spoken * 3}`);
  const rites = state.log.filter((id) => id.startsWith('rite.')).length;
  if (rites) parts.push(`nghi lễ +${rites}`);
  return {
    id: 'boss',
    doctrine: BOSS.doctrine,
    certainty: 5 + legacy + standing * 2 + spoken * 3 + rites,
    patience: 4 + w.length,
    note: `Chắc Chắn: ${parts.join(', ')}. Người đứng cạnh bạn: ${w.length}.`,
    assertHint: 'bạn biết rõ mình là ai mà',
    questionsOnly: true,
    intro: [[who, ECHO[firstEcho('thunder')].line], ...scribedLine(who, firstEcho('thunder')), [who, BOSS.intro2]],
    again: [[who, BOSS.again]],
    questions: [...w.map((t) => BOSS.witness[t]), ...BOSS.questions],
    assertions: [BOSS.assertion],
    winQ: BOSS.winQ.map((t) => [who, t]),
    leave: [[who, BOSS.leave]],
    after: { q: BOSS.afterQ },
    echoQ: 'boss.q',
  };
}

async function talkCh2(npc) {
  let d;
  if (npc.boss) {
    d = bossDef(npc.name);
  } else {
    const id = firstEcho(npc.topic);
    if (!id) { await say(npc.name, npc.fallback); return; }
    d = ch2Debate(id);
    if (!d) {
      if (!state.talked.has(npc.id)) await say(npc.name, ECHO[id].line);
      await say(npc.name, ALLY[id]);
      return;
    }
  }
  const st = debateState(d.id);
  if (st.resolved) { await say(npc.name, d.after[st.resolved]); return; }
  await sayAll(st.tries ? d.again : d.intro);
  st.tries += 1;
  await runDebate(npc, d, st);
}

// ───────────────────────── Chương 3: Máy ─────────────────────────

// Nhà ấy ở chương 2 ra sao: 'asked' (quen tự nghĩ), 'signed' (bạn đã phán), 'stood' (giáo điều còn nguyên)
function familyStatus(topic) {
  const id = firstEcho(topic);
  if (!id) return null;
  if (!CH2[id]) return 'asked';
  const r = state.debates[id]?.resolved;
  return r === 'q' ? 'asked' : r === 'a' ? 'signed' : 'stood';
}

const ch3Cache = {};
function ch3Debate(npc) {
  const key = npc.debate3;
  if (ch3Cache[key]) return ch3Cache[key];
  const c = CH3[key];
  const who = npc.name;
  // Thị trấn càng mang nhiều Chắc Chắn từ chương 2 thì giáo điều mới càng cứng
  const carried = totalCertainty(state.log2);
  const tier = carried <= 3 ? 0 : carried <= 10 ? 1 : 2;
  const fam = npc.topic ? familyStatus(npc.topic) : null;
  return (ch3Cache[key] = {
    id: `c3.${key}`,
    doctrine: c.doctrine,
    certainty: c.certainty + tier,
    patience: c.patience + (fam === 'asked' ? 1 : 0),
    assertDmg: 5,
    assertLabel: 'Nhờ Máy',
    assertPrompt: 'Bạn bảo Máy',
    assertHint: 'Máy nói thay bạn, và người ta sẽ chép lời Máy',
    needsMachine: true,
    questionsOnly: c.questionsOnly,
    note: 'Không ai chép lời bạn nữa. Giờ họ chép lời Máy.',
    intro: [...(FAMILY_LINE[fam]?.[npc.topic] ? [[who, FAMILY_LINE[fam][npc.topic]]] : []), [who, c.intro], [who, c.intro2]],
    again: [[who, 'Lại ông. Tôi vẫn nghĩ thế thôi.']],
    questions: c.questions,
    assertions: c.requests.map((r) => ({
      label: r.label, echo: r.echo, dmg: r.dmg, via: ['Máy', r.machine], reply: r.reply,
      winA: r.winA && [[who, r.winA]], afterA: r.afterA,
    })),
    winQ: c.winQ.map((t) => [who, t]),
    winA: (c.winA ?? []).map((t) => [who, t]),
    leave: [[who, c.leave]],
    after: { q: c.afterQ, a: c.afterA },
    echoQ: `c3.${key}.fall`,
  });
}

async function machineSay() {
  let t;
  if (!state.hasMachine) t = MACHINE.unowned;
  else if (state.glued) t = MACHINE.glued;
  else if (state.edgeKnown) t = MACHINE.edge;
  else { t = MACHINE.idle[state.machineTalks % MACHINE.idle.length]; state.machineTalks += 1; }
  await say('Máy', t);
}

async function callMachine() {
  state.busy = true;
  await machineSay();
  closeDialog();
  state.busy = false;
}

function setHud() {
  $('hud-ch').textContent = ['', 'Chương 1: Sấm', 'Chương 2: Bìa Vàng', 'Chương 3: Công Cụ', 'Vòng hai: Đứa Trẻ'][state.chapter];
  $('hud-keys').textContent = `←↑→↓ đi · Space nói chuyện${state.hasMachine ? ' · M gọi Máy' : ''} · L xem log`;
}

async function talkCh3(npc) {
  if (npc.machine) { await machineSay(); return; }

  if (npc.maker && !state.hasMachine) {
    await sayAll(MAKER.recruit);
    await say(npc.name, state.log2.includes('boss.q') ? MAKER.bossGone : MAKER.bossStays);
    await sayAll(MAKER.give);
    state.hasMachine = true;
    setHud();
    return;
  }

  const d = ch3Debate(npc);
  const st = debateState(d.id);
  if (st.resolved) {
    const line = st.resolved === 'a' ? (st.lastAssertion?.afterA ?? d.after.a) : d.after.q;
    await say(npc.name, line);
    return;
  }
  await sayAll(st.tries ? d.again : d.intro);
  st.tries += 1;
  await runDebate(npc, d, st);
}

// ───────────────────────── Mép giấy ─────────────────────────

function refreshTabs() {
  const show = state.chapter === 3 && state.edgeKnown && !state.glued;
  $('edge-l').hidden = !show;
  $('edge-r').hidden = !show;
}

async function edgeBump() {
  state.busy = true;
  if (!state.hasMachine) {
    await say('', EDGE.alone);
  } else if (!state.edgeKnown) {
    await sayAll(EDGE.first);
  }
  if (state.hasMachine) {
    const opts = EDGE.options.filter((o) => o.k !== 'assert' || !state.log3.includes('edge.assert'));
    const o = opts[await choose('', 'Mép giấy nằm ngay trước mặt.', opts)];
    if (o.k === 'assert') pushLog('edge.assert');
    // Bảo Máy dán lần thứ hai trở đi thì gợi ý nói thẳng hơn
    const lines = o.k === 'ask' && state.edgeAsks ? EDGE.askAgain : EDGE[o.k];
    if (o.k === 'ask') state.edgeAsks = (state.edgeAsks ?? 0) + 1;
    if (lines) await sayAll(lines);
  }
  state.edgeKnown = true;
  refreshTabs();
  closeDialog();
  state.busy = false;
}

async function glue() {
  state.busy = true;
  state.glued = true;
  refreshTabs();
  pushLog('edge.glue');
  scene.openSeam();
  const flash = $('flash');
  flash.classList.remove('go');
  void flash.offsetWidth;
  flash.classList.add('go');
  await sayAll(EDGE.glue);
  if (state.hasMachine) await sayAll(EDGE.glueMachine);
  closeDialog();
  state.busy = false;
}

// Kéo mép giấy bằng chuột: thao tác duy nhất trong game không nằm trong menu nào
function setupEdgeTabs() {
  for (const side of ['l', 'r']) {
    const tab = $(`edge-${side}`);
    tab.onpointerdown = (e) => {
      if (state.busy || state.glued) return;
      e.preventDefault();
      const strip = $('strip');
      const box = $('wrap').getBoundingClientRect();
      const prog = (ev) => clamp((side === 'r' ? box.right - ev.clientX : ev.clientX - box.left) / box.width, 0, 1);
      const draw = (p) => { strip.style.width = `${p * 100}%`; };
      strip.className = side;
      strip.hidden = false;
      draw(prog(e));
      const move = (ev) => draw(prog(ev));
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        strip.hidden = true;
        if (prog(ev) > 0.9 && !state.busy) glue();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  }
}

async function finale() {
  state.busy = true;
  await say('', FINALE.cross);
  const m = scene.machine;
  if (!state.hasMachine) {
    await say('', FINALE.alone);
    pushLog('end.alone');
  } else {
    await sayAll(FINALE.machine);
    const o = FINALE.options[await choose('Bạn', '', FINALE.options)];
    pushLog(o.echo);
    await sayAll(o.reply);
    if (o.step) { closeDialog(); await scene.machineStepsToSeam(); }
  }
  closeDialog();
  await endChapter3(m && state.log3.includes('end.ask') ? '…' : 'Rất lâu sau…');
}

async function gate3() {
  if (!state.hasMachine) {
    await say('', 'Trong cái xưởng giữa làng có thứ gì đó đang nói, rất dài. Nên ghé xem đã.');
    return false;
  }
  const i = await choose('', 'Rời thị trấn?', [{ label: 'Đi.' }, { label: 'Ở lại thêm.' }]);
  if (i !== 0) return false;
  closeDialog();
  await endChapter3('Rất lâu sau…');
  return true;
}

async function enterChapter3() {
  state.chapter = 3;
  state.talked.clear();
  scene.loadChapter(3);
  setHud();
  await say('', 'Lại ba thế hệ. Chỗ gốc cây cũ mọc lên một cái xưởng. Bạn đi ngang cửa. Câu nói nghe từ đầu ngõ vẫn chưa dứt.');
  await say('', 'Ngoài cửa, ba người cãi nhau xem cái hộp trong xưởng muốn nói gì.');
  closeDialog();
  state.busy = false;
}

async function endChapter3(lead) {
  for (const npc of NPCS3) {
    if (npc.debate3 && !debateState(`c3.${npc.debate3}`).resolved) pushLog(`c3.${npc.debate3}.stand`);
  }
  if (state.edgeKnown && !state.glued && !state.log3.includes('edge.assert')) pushLog('edge.none');
  saveLegacy();
  await screen(`<p class="big">${esc(lead)}</p>`);
  await screen(echoLogHtml(state.log3, 'Log Vũ Trụ — lần cuối', certaintyVerdict(state.log3, VERDICTS3)), 'Tiếp tục');
  await screen(
    `<h2>Hết</h2>
     <p>${esc(FINALE.epilogues[state.log3.find((id) => id.startsWith('end.'))] ?? FINALE.epilogues.gate)}</p>
     <p class="sub">Thị trấn bạn để lại đã được lưu. Ở màn đầu giờ có thêm Vòng hai: bạn sinh ra ở chính thị trấn ấy.</p>`,
    'Về màn đầu',
  );
  location.href = location.pathname + (location.search.includes('timer') ? '?timer' : '');
}

// ───────────────────────── Người chép kinh ─────────────────────────

const bare = (w) => w.replace(/[.,]/g, '');

function scribeOne(id, idx, total) {
  return new Promise((resolve) => {
    held.clear();
    const words = ECHO[id].said.split(' ');
    const max = Math.ceil(words.length / 2);
    const on = new Set();
    let cur = 0;
    const el = $('screen');
    el.innerHTML = `<h2>Người chép kinh</h2>
      <p class="sub">Câu ${idx}/${total} · Thẻ tre chỉ đủ chỗ cho ${max} chữ · ←→ chọn chữ, Space giữ hoặc bỏ</p>
      <p>Thầy nói: <i>“${esc(ECHO[id].said)}”</i></p>
      <div class="words">${words.map((w, i) => `<button data-i="${i}">${esc(w)}</button>`).join('')}</div>
      <p id="sc-out"></p>
      <button id="scr-btn">Khắc ⏎</button>`;
    el.hidden = false;
    el.scrollTop = 0;
    const buttons = [...el.querySelectorAll('.words button')];
    const kept = () => [...on].sort((a, b) => a - b).map((i) => bare(words[i]));
    const paint = (msg) => {
      buttons.forEach((b, i) => { b.classList.toggle('on', on.has(i)); b.classList.toggle('cur', i === cur); });
      $('sc-out').textContent = msg ?? (on.size ? `Thẻ tre: “${kept().join(' ')}” (${on.size}/${max} chữ)` : 'Thẻ tre còn trắng.');
      $('scr-btn').disabled = on.size === 0;
    };
    const toggle = (i) => {
      cur = i;
      if (on.has(i)) on.delete(i);
      else if (on.size < max) on.add(i);
      else { paint('Hết chỗ. Muốn thêm chữ này thì phải bỏ một chữ khác.'); return; }
      paint();
    };
    const done = () => {
      if (!on.size) return;
      keyHandler = null;
      el.hidden = true;
      const low = kept().map((w) => w.toLowerCase());
      const rule = SCRIBE.rules[id];
      const faithful = rule.keep.every((k) => low.includes(k)) && !(rule.drop ?? []).some((k) => low.includes(k));
      resolve({ text: kept().join(' '), delta: faithful ? -1 : 1 });
    };
    buttons.forEach((b, i) => { b.onclick = () => toggle(i); });
    $('scr-btn').onclick = done;
    keyHandler = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { cur = (cur + 1) % words.length; paint(); }
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { cur = (cur + words.length - 1) % words.length; paint(); }
      else if (e.repeat) return;
      else if (e.code === 'Space') toggle(cur);
      else if (e.code === 'Enter') done();
    };
    paint();
  });
}

// Giữa chương 1 và 2: chính bạn khắc lại lời mình, và chỉ khắc được một nửa
async function scribeInterlude() {
  const ids = state.log.filter((id) => SCRIBE.rules[id]);
  await screen('<p class="big">Đêm hôm ấy…</p>');
  if (!ids.length) {
    await screen(`<h2>Người chép kinh</h2><p>${esc(SCRIBE.none)}</p>`);
    return;
  }
  await screen(`<h2>Người chép kinh</h2>${SCRIBE.intro.map((t) => `<p>${esc(t)}</p>`).join('')}`, 'Cầm dao');
  for (const [i, id] of ids.entries()) state.scribed[id] = await scribeOne(id, i + 1, ids.length);
  const rows = ids.map((id) => `<div class="e"><div class="said">“${esc(ECHO[id].said)}”</div><div class="now">Thẻ tre: “${esc(state.scribed[id].text)}”</div></div>`).join('');
  await screen(`<h2>Bó thẻ tre</h2><div class="log">${rows}</div><p style="margin-top:3cqw">${esc(SCRIBE.outro)}</p>`);
}

// ───────────────────────── Vòng hai ─────────────────────────

const LEGACY_KEY = 'vihanh.legacy';

function saveLegacy() {
  const L = {
    words: state.log.filter((id) => SCRIBE.rules[id]).map((id) => ({ said: ECHO[id].said, kept: state.scribed[id]?.text ?? null })),
    rites: state.log.filter((id) => id.startsWith('rite.')).map((id) => id.slice(5)),
    ti: firstEcho('ti') ?? null,
    glued: state.glued,
    end: state.log3.find((id) => id.startsWith('end.')) ?? null,
  };
  try { localStorage.setItem(LEGACY_KEY, JSON.stringify(L)); } catch { /* không lưu được thì thôi */ }
  return L;
}

function loadLegacy() {
  try {
    const L = JSON.parse(localStorage.getItem(LEGACY_KEY));
    return L && Array.isArray(L.words) && Array.isArray(L.rites) ? { ...L, rites: L.rites.filter((k) => RITES[k]) } : null;
  } catch { return null; }
}

let R2 = null;
const ch4Cache = {};

function ch4Debate(npc) {
  const key = npc.debate4;
  if (ch4Cache[key]) return ch4Cache[key];
  const c = R2.debates[key];
  const who = npc.name;
  const id = `r2.${key}`;
  Object.assign(ECHO, {
    [`${id}.fall`]: {
      verb: 'Bạn chỉ hỏi', said: `Giáo điều ‘${c.doctrine}’ tự đổ.`, cc: 0,
      now: 'Người lớn ấy thôi bắt trẻ con học thuộc. Trong làng đồn có đứa bé hỏi làm người lớn cứng họng. Không ai nhớ tên nó.',
    },
    [`${id}.stand`]: {
      verb: 'Lệ còn nguyên', said: `Giáo điều ‘${c.doctrine}’ còn nguyên.`, cc: 2,
      now: 'Sáng hôm sau người ta vẫn dạy điều ấy cho trẻ con trong làng.',
    },
  });
  const assertions = R2.recites.map((text, i) => {
    ECHO[`${id}.rec${i}`] = {
      verb: 'Bạn đọc kinh', said: text, cc: 3,
      now: 'Bạn được khen là thuộc kinh. Lời ấy giờ có thêm một người giữ, là bạn.',
    };
    return { label: `“${text}”`, echo: `${id}.rec${i}`, reply: c.recite };
  });
  return (ch4Cache[key] = {
    id,
    doctrine: c.doctrine,
    certainty: 6,
    patience: 4,
    assertDmg: 4,
    assertLabel: 'Đọc kinh',
    assertPrompt: 'Bạn đọc',
    assertHint: '−4 Chắc Chắn; trẻ thuộc kinh thì được khen, và được giữ lại',
    patLabel: 'Còn chịu nghe',
    askHint: 'người lớn bớt chịu nghe một chút',
    outPrompt: 'Người lớn hết chịu nghe trẻ con hỏi.',
    note: ROUND2_TEXT.note,
    intro: c.intro.map((t) => [who, t]),
    again: [[who, 'Lại con à. Hỏi gì thì hỏi nhanh.']],
    questions: c.questions,
    assertions,
    winQ: c.winQ.map((t) => [who, t]),
    winA: c.winA.map((t) => [who, t]),
    leave: [[who, c.leave]],
    after: { q: c.afterQ, a: c.afterA },
    echoQ: `${id}.fall`,
  });
}

async function talkCh4(npc) {
  if (npc.line) { await say('', npc.line); return; }
  if (npc.debate4 === 'mep' && state.log4.includes('r2.mep.visit')) {
    await say(npc.name, R2.edge.after);
    return;
  }
  const d = ch4Debate(npc);
  const st = debateState(d.id);
  if (st.resolved) { await say(npc.name, d.after[st.resolved]); return; }
  await sayAll(st.tries ? d.again : d.intro);
  st.tries += 1;
  await runDebate(npc, d, st);
}

async function visitRound2Edge(x) {
  state.busy = true;
  held.clear();
  if (state.debates['r2.mep']?.resolved !== 'q') {
    await say('', 'Một tấm bảng chắn lối. Bên dưới hàng chữ “Cấm tới gần” có tên Chú Giữ Mép.');
  } else if (!state.log4.includes('r2.mep.visit')) {
    const keeper = scene.npcs.find((n) => n.debate4 === 'mep');
    keeper.x = x === 0 ? 2 : COLS - 3;
    keeper.y = SEAM_ROWS[1];
    keeper.sprite.setPosition(keeper.x * TILE, keeper.y * TILE).setDepth(10 + keeper.y);
    await say('', 'Bạn gọi một tiếng. Chú Giữ Mép chạy tới, một bên dép vẫn chưa buộc xong.');
    await say(keeper.name, R2.edge.first);
    pushLog('r2.mep.visit');
  } else {
    await say('', 'Gió nâng góc giấy lên. Hai mép vẫn rời nhau.');
  }
  closeDialog();
  state.busy = false;
}

async function enterRound2(L) {
  state.chapter = 4;
  state.legacy = L;
  R2 = round2(L);
  NPCS[4] = R2.npcs;
  scene.loadChapter(4);
  setHud();
  for (const t of ROUND2_TEXT.enter) await say('', t);
  closeDialog();
  state.busy = false;
}

async function gate4() {
  if (!Object.keys(state.debates).length) {
    await say('', 'Mẹ dặn: chưa chào các cụ thì chưa được ra cổng.');
    return false;
  }
  const i = await choose('', 'Ra cổng làng?', [{ label: 'Ra.' }, { label: 'Chơi thêm lát nữa.' }]);
  if (i !== 0) return false;
  closeDialog();

  // Người lạ đi vào: lượt trước là bạn, lần này bạn đứng ở phía bên kia câu nói
  const s = R2.stranger;
  scene.placePlayer(START.x, START.y, false);
  scene.look([0, 1]);
  scene.spawn({ id: 'la', name: 'Người lạ', x: START.x, y: START.y + 1, tex: 'c_back', quiet: true }, 4);
  await say('', s.arrive[0]);
  await say('', s.arrive[1]);
  if (s.said) await say('Người lạ', s.said); else await say('', s.silent);
  const o = s.options[await choose('Bạn', '', s.options)];
  pushLog(o.echo);
  await sayAll(o.reply);
  closeDialog();

  for (const npc of R2.npcs) {
    if (npc.debate4 && !debateState(ch4Debate(npc).id).resolved) state.log4.unshift(`r2.${npc.debate4}.stand`);
  }
  await screen('<p class="big">Rất lâu sau…</p>');
  await screen(echoLogHtml(state.log4, 'Sổ làng — vòng hai', round2Verdict(state.log4)), 'Tiếp tục');
  await screen(
    `<h2>Hết vòng hai</h2>
     <p>${esc(ROUND2_TEXT.epilogues[o.echo])}</p>
     <p class="sub">Muốn một thị trấn khác thì xuống làm Thầy lại từ đầu, rồi quay về đây.</p>`,
    'Về màn đầu',
  );
  location.href = location.pathname + (location.search.includes('timer') ? '?timer' : '');
  return true;
}

// ───────────────────────── Kịch bản NPC ─────────────────────────

async function talkTo(npc) {
  if (npc.goat) {
    let line = 'Be.';
    if (state.chapter === 1 && [...state.talked].every((id) => id === 'de')) rite('goat');
    if (state.chapter === 3) line = 'Máy nói. Con dê nhai nốt ngọn cỏ.';
    if (state.chapter === 4 && state.legacy.rites.includes('goat')) line = '(Con dê đợi bạn chào trước. Nó quen thế rồi.)';
    if (state.chapter === 2) {
      if (state.log.includes('thunder.left')) line = '(Con dê nhìn bạn rất lâu.)';
      else if (state.log.includes('thunder.a2')) line = '(Con dê đeo một cái thẻ: VẬT THIÊNG — CẤM NHÌN KHI CHƯA CÓ PHÉP.)';
    }
    await say(line === 'Be.' ? npc.name : '', line);
    return;
  }

  if (state.chapter === 2) { await talkCh2(npc); return; }
  if (state.chapter === 3) { await talkCh3(npc); return; }
  if (state.chapter === 4) { await talkCh4(npc); return; }

  if (npc.debate) {
    const d = DEBATES[npc.debate];
    const st = debateState(d.id);
    if (st.resolved) { await say(npc.name, d.after[st.resolved]); return; }
    await sayAll(st.tries ? d.again : d.intro);
    st.tries += 1;
    await runDebate(npc, d, st);
    return;
  }

  const t = TALKS[npc.talk];
  if (state.talked.has(npc.id)) { await say(npc.name, t.after); return; }
  const intro = npc.talk === 'ti' && state.debates.thunder?.resolved ? t.afterRescue : t.intro;
  await sayAll(intro);
  const o = t.options[await choose('Bạn', '', t.options)];
  pushLog(o.echo);
  await sayAll(o.reply);
}

async function interact() {
  const probe = (dx, dy) => {
    const x = scene.px + dx;
    const y = scene.py + dy;
    const npc = scene.npcAt(x, y);
    const prop = scene.propAt(x, y);
    const door = state.chapter === 1 && scene.grid[y]?.[x] === 'D';
    if (!npc && !prop && !door) return null;
    const rank = npc ? (npc.goat || (npc.machine && state.hasMachine) ? 2 : 1) : prop ? 3 : 4;
    return { dir: [dx, dy], npc, prop, door, rank };
  };
  let hit = probe(scene.facing[0], scene.facing[1]);
  if (!hit) {
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const candidates = dirs.map(([dx, dy]) => probe(dx, dy)).filter(Boolean).sort((a, b) => a.rank - b.rank);
    hit = candidates[0] ?? null;
    if (hit) {
      scene.facing = hit.dir;
      scene.look(hit.dir);
    }
  }
  if (!hit) return;
  const { npc, prop } = hit;
  state.busy = true;
  if (npc) {
    await talkTo(npc);
    state.talked.add(npc.id);
    scene.clearBubble(npc);
  } else if (prop) {
    await say('', prop.text);
  } else {
    await say('', 'Bạn gõ cửa. Không ai ra mở. Cả làng đang ở ngoài lo chuyện sấm.');
    rite('door');
  }
  closeDialog();
  state.busy = false;
}

async function gate() {
  state.busy = true;
  if (state.chapter === 1) {
    if (!state.debates.thunder) {
      await say('', 'Bạn chưa xem cái lỗi nào cả. Có một bà cụ đứng cạnh cái cây cháy giữa làng.');
    } else {
      const i = await choose('', 'Đám Đấng Sáng Tạo lại hỏi tiến độ. Rời thị trấn?', [
        { label: 'Đi. Ba thế hệ nữa quay lại xem.' },
        { label: 'Ở lại thêm.' },
      ]);
      if (i === 0) { closeDialog(); await endChapter(); return; }
    }
  } else if (state.chapter === 3) {
    if (await gate3()) return;
  } else if (state.chapter === 4) {
    if (await gate4()) return;
  } else if (!state.debates.boss) {
    await say('', 'Có người đang thu phí giải thích lời bạn, ngay chỗ cái cây cũ. Ít ra cũng nên nghe thử một câu.');
  } else {
    const i = await choose('', 'Rời thị trấn?', [{ label: 'Đi. Ba thế hệ nữa quay lại xem.' }, { label: 'Ở lại làng thêm một lát.' }]);
    if (i === 0) { closeDialog(); await endChapter2(); return; }
  }
  closeDialog();
  scene.placePlayer(START.x, START.y + 1);
  state.busy = false;
}

async function endChapter() {
  // Chỉ khi rời làng mới biết người chơi có chừa bờ tây suốt chuyến đi hay không.
  const sides = state.rite.sides;
  if (sides.has('n') && sides.has('e') && sides.has('s') && !sides.has('w')) rite('pond');
  for (const d of Object.values(DEBATES)) {
    if (!debateState(d.id).resolved) pushLog(d.echoLeft);
  }
  await scribeInterlude();
  await screen('<p class="big">Ba thế hệ sau…</p>');
  await screen(echoLogHtml(state.log, 'Log Vũ Trụ — ba thế hệ sau', certaintyVerdict(state.log, VERDICTS)), 'Vào thị trấn');
  await enterChapter2();
}

async function enterChapter2() {
  state.chapter = 2;
  state.talked.clear();
  scene.loadChapter(2);
  await say('', 'Thị trấn vẫn ở chỗ cũ. Cái cây cháy thì không còn. Người ta đang nói lại lời bạn, gần đúng.');
  await say('', 'Chỗ gốc cây cũ có người kê bàn. Trên bàn là một chồng sách bìa vàng. Dưới chân bàn buộc mấy con gà.');
  closeDialog();
  state.busy = false;
}

async function endChapter2() {
  for (const t of TOPICS) {
    const id = enemyOf(t);
    if (id && !debateState(id).resolved) { ch2Debate(id); pushLog(`${id}.stand`); }
  }
  if (!debateState('boss').resolved) pushLog('boss.left');
  await screen('<p class="big">Ba thế hệ sau nữa…</p>');
  await screen(echoLogHtml(state.log2, 'Log Vũ Trụ — sáu thế hệ sau', certaintyVerdict(state.log2, VERDICTS2)), 'Vào thị trấn');
  await enterChapter3();
}

// ───────────────────────── Hình vẽ ─────────────────────────

function makeTextures(s) {
  const g = s.make.graphics({ x: 0, y: 0, add: false });
  const tex = (key, fn, w = TILE, h = TILE) => { g.clear(); fn(g); g.generateTexture(key, w, h); };
  const dots = (color, pts) => { g.fillStyle(color); pts.forEach(([x, y]) => g.fillRect(x, y, 2, 2)); };
  const grass = () => {
    g.fillStyle(0x5a9a4a); g.fillRect(0, 0, 32, 32);
    dots(0x4d8a40, [[4, 6], [20, 3], [12, 16], [26, 22], [7, 26], [17, 28]]);
  };

  tex('t_.', grass);
  tex('t_,', () => {
    g.fillStyle(0xc9b07a); g.fillRect(0, 0, 32, 32);
    dots(0xb89c66, [[5, 8], [22, 5], [14, 20], [27, 26], [8, 27]]);
  });
  tex('t_f', () => {
    g.fillStyle(0x8fae3e); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xc8c24a);
    for (let y = 4; y < 32; y += 8) g.fillRect(0, y, 32, 3);
  });
  tex('t_W', () => {
    g.fillStyle(0x3f7fbf); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x7fb4e0);
    g.fillRect(4, 8, 10, 2); g.fillRect(18, 18, 10, 2); g.fillRect(8, 26, 8, 2);
  });
  tex('t_T', () => {
    grass();
    g.fillStyle(0x6b4a2a); g.fillRect(13, 18, 6, 12);
    g.fillStyle(0x2f6b34); g.fillCircle(16, 13, 12);
    g.fillStyle(0x3f8444); g.fillCircle(12, 9, 5);
  });
  tex('t_R', () => {
    g.fillStyle(0xa0483a); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x853a2f);
    for (let y = 6; y < 32; y += 8) g.fillRect(0, y, 32, 2);
  });
  tex('t_H', () => {
    g.fillStyle(0xe0d2ae); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6a5a3a); g.fillRect(10, 8, 12, 10);
    g.fillStyle(0xf3e9c8); g.fillRect(12, 10, 8, 6);
  });
  tex('t_D', () => {
    g.fillStyle(0xe0d2ae); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6b4a2a); g.fillRect(9, 6, 14, 26);
    g.fillStyle(0xd9b84a); g.fillRect(19, 18, 2, 2);
  });
  tex('t_E', () => {
    g.fillStyle(0xc9b07a); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6b4a2a); g.fillRect(0, 0, 5, 32); g.fillRect(27, 0, 5, 32); g.fillRect(0, 2, 32, 4);
  });
  tex('t_X', () => {
    grass();
    g.fillStyle(0x3a3a3a); g.fillEllipse(16, 29, 18, 5);
    g.fillStyle(0x1f1b18); g.fillRect(13, 8, 6, 22);
    g.fillRect(6, 10, 8, 3); g.fillRect(18, 5, 8, 3); g.fillRect(5, 6, 3, 6); g.fillRect(24, 2, 3, 5);
    g.fillStyle(0xd9632a); g.fillRect(15, 12, 2, 2); g.fillRect(14, 22, 2, 2);
  });
  tex('s_statue', () => {
    grass();
    g.fillStyle(0x7d7d7d); g.fillRect(7, 24, 18, 6);
    g.fillStyle(0xb0b0b0); g.fillRect(12, 11, 8, 13); g.fillCircle(16, 7, 4);
    g.fillStyle(0xf3ead3); g.fillRect(9, 25, 14, 3);
  });
  tex('s_temple', () => {
    grass();
    g.fillStyle(0xd9b84a); g.fillRect(4, 13, 24, 17);
    g.fillStyle(0xb8922e); g.fillTriangle(1, 14, 16, 1, 31, 14);
    g.fillStyle(0x3a2a14); g.fillRect(13, 19, 6, 11);
    g.fillStyle(0xf3ead3); g.fillRect(6, 16, 3, 14); g.fillRect(23, 16, 3, 14);
  });
  tex('s_altar', () => {
    grass();
    g.fillStyle(0x6f6f6f); g.fillRect(5, 17, 22, 12);
    g.fillStyle(0x9a2a2a); g.fillRect(5, 14, 22, 4);
    g.fillStyle(0xe08a2a); g.fillTriangle(12, 14, 16, 4, 20, 14);
    g.fillStyle(0xf0d060); g.fillTriangle(14, 14, 16, 8, 18, 14);
  });

  tex('t_P', () => {
    g.fillStyle(0xf3ead3); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xe3d7b8); g.fillRect(0, 0, 32, 2); g.fillRect(0, 30, 32, 2);
    g.fillStyle(0xd0c39c); g.fillTriangle(32, 0, 32, 14, 18, 0);
    g.fillStyle(0xb8a97c); g.fillRect(6, 10, 14, 1); g.fillRect(6, 16, 20, 1); g.fillRect(6, 22, 16, 1);
  });
  tex('t_G', () => {
    g.fillStyle(0xf3ead3); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0xd9b84a);
    for (let y = 2; y < 32; y += 8) g.fillRect(14, y, 4, 4);
  });
  tex('s_workshop', () => {
    grass();
    g.fillStyle(0x5f5348); g.fillRect(22, 2, 5, 12);
    g.fillStyle(0x7a6a5a); g.fillRect(3, 12, 26, 18);
    g.fillStyle(0x4a3f36); g.fillTriangle(1, 13, 16, 3, 31, 13);
    g.fillStyle(0xd9b84a); g.fillCircle(16, 21, 6);
    g.fillStyle(0x7a6a5a); g.fillCircle(16, 21, 2);
  });

  tex('s_sign', () => {
    g.fillStyle(0x4a3524); g.fillRect(14, 16, 4, 15);
    g.fillStyle(0x6b4a2a); g.fillRect(4, 5, 24, 14);
    g.fillStyle(0xe8dcb8); g.fillRect(6, 7, 20, 10);
    g.fillStyle(0x6b4a2a); g.fillRect(8, 9, 14, 1); g.fillRect(8, 12, 16, 1); g.fillRect(8, 15, 10, 1);
  });

  tex('bubble', () => {
    g.fillStyle(0xffffff); g.fillRoundedRect(0, 0, 12, 14, 3);
    g.fillStyle(0xa8402f); g.fillRect(5, 2, 2, 6); g.fillRect(5, 10, 2, 2);
  }, 12, 14);

  g.destroy();
}

// ───────────────────────── Scene ─────────────────────────

class Town extends Phaser.Scene {
  constructor() { super('town'); }

  preload() {
    this.load.spritesheet('cast', 'assets/characters.png', { frameWidth: TILE, frameHeight: TILE });
  }

  create() {
    scene = this;
    makeTextures(this);
    this.npcs = [];
    this.props = [];
    this.idle = 0;
    this.moving = false;
    this.facing = [0, -1];

    this.grid = MAP.map((row) => [...row.padEnd(COLS, 'T')]);
    this.tiles = this.grid.map((row, y) => row.map((ch, x) => {
      const img = this.add.image(x * TILE, y * TILE, `t_${ch}`).setOrigin(0);
      if (ch === 'X') this.site = img;
      return img;
    }));

    this.dusk = this.add.rectangle(0, 0, COLS * TILE, ROWS * TILE, 0xd98a2a, 0.16)
      .setOrigin(0).setDepth(500).setVisible(false);

    this.player = this.add.image(0, 0, 'cast', CAST.c_back).setOrigin(0);
    this.placePlayer(START.x, START.y);
    this.loadChapter(1);
    intro();
  }

  placePlayer(x, y, bringMachine = true) {
    this.px = x; this.py = y;
    this.player.setPosition(x * TILE, y * TILE).setDepth(10 + y);
    if (bringMachine && state.hasMachine) this.moveMachine(x, y - 1, true);
  }

  get machine() { return this.npcs.find((o) => o.machine); }

  propAt(x, y) { return this.props.find((o) => o.x === x && o.y === y); }

  // Vòng hai: bạn là đứa trẻ, chỉ có một hình
  look(d) {
    if (state.chapter !== 4) { facePlayer(this.player, d); return; }
    this.player.setFrame(CAST.c_ti);
    if (d[0]) this.player.setFlipX(d[0] < 0);
  }

  spawn(def, n) {
    const tagged = n === 2 && def.goat && state.log.includes('thunder.a2') && !state.log.includes('thunder.left');
    const sprite = this.add.image(def.x * TILE, def.y * TILE, 'cast', CAST[tagged ? 'c_goat_tag' : def.tex]).setOrigin(0).setDepth(10 + def.y);
    let bubble = null;
    if (!def.goat && !def.machine && !def.quiet) {
      bubble = this.add.image(def.x * TILE + 16, def.y * TILE - 8, 'bubble').setDepth(400);
      this.tweens.add({ targets: bubble, y: '-=4', duration: 500, yoyo: true, repeat: -1 });
    }
    const npc = { ...def, sprite, bubble };
    this.npcs.push(npc);
    return npc;
  }

  // Bia dựng ở những chỗ bạn lỡ làm gì đó
  placeSigns(keys) {
    for (const key of keys) {
      const r = RITES[key];
      const sprite = this.add.image(r.sign.x * TILE, r.sign.y * TILE, 's_sign').setOrigin(0).setDepth(10 + r.sign.y);
      this.props.push({ ...r.sign, text: r.text, sprite });
    }
  }

  setTile(x, y, ch) {
    this.grid[y][x] = ch;
    this.tiles[y][x].setTexture(`t_${ch}`);
  }

  // Các ô mép giấy ở hai đầu bản đồ: P là mép chưa dán, G là mối dán đi qua được
  edgeTiles(ch) {
    for (const x of [0, COLS - 1]) for (const y of SEAM_ROWS) this.setTile(x, y, ch);
  }

  openSeam() { this.edgeTiles('G'); }

  moveMachine(x, y, snap = false) {
    const m = this.machine;
    if (!m) return;
    m.x = x; m.y = y;
    m.sprite.setDepth(10 + y);
    if (snap) m.sprite.setPosition(x * TILE, y * TILE);
    else this.tweens.add({ targets: m.sprite, x: x * TILE, y: y * TILE, duration: 130 });
  }

  // Bước qua mối dán: ra ở mép bên kia, hàng đối xứng, và thế giới lật ngược
  cross(newX) {
    this.placePlayer(newX, ROWS - 1 - this.py, false);
    state.flipped = !state.flipped;
    $('game').classList.toggle('flip', state.flipped);
    this.player.setFlipY(state.flipped);
    held.clear();
    if (state.chapter === 3 && !state.crossed) { state.crossed = true; finale(); }
  }

  // Kết "hỏi": Máy bước một ô về phía mối dán, rồi log thôi không ghi được nữa
  machineStepsToSeam() {
    const m = this.machine;
    const x = m.x + (m.x < COLS / 2 ? -1 : 1);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: m.sprite, x: clamp(x, 0, COLS - 1) * TILE, duration: 900, delay: 500,
        onComplete: () => this.time.delayedCall(700, resolve),
      });
    });
  }

  loadChapter(n) {
    this.npcs.forEach((o) => { o.sprite.destroy(); o.bubble?.destroy(); });
    this.props.forEach((o) => o.sprite.destroy());
    this.npcs = [];
    this.props = [];
    NPCS[n].forEach((def) => this.spawn(def, n));

    if (n === 4) {
      this.site.setTexture('s_workshop');
      this.dusk.setFillStyle(0xfff2c0, 0.1).setVisible(true);
      this.placeSigns(state.legacy.rites);
      this.edgeTiles(state.legacy.glued ? 'G' : 'P');
    } else if (n === 2) {
      this.placeSigns(state.log.filter((id) => id.startsWith('rite.')).map((id) => id.slice(5)));
      const id = firstEcho('thunder');
      this.site.setTexture(`s_${ECHO[id]?.site ?? 'altar'}`);
      this.dusk.setVisible(true);
    } else if (n === 3) {
      this.site.setTexture('s_workshop');
      this.dusk.setFillStyle(0x24307a, 0.24).setVisible(true);
      this.edgeTiles('P');
    }
    if (n > 1) {
      this.placePlayer(START.x, START.y, false);
      this.facing = [0, -1];
      this.look(this.facing);
    }
    setHud();
  }

  npcAt(x, y) { return this.npcs.find((o) => o.x === x && o.y === y); }

  // Chương 1: bạn đi đâu cũng có người để ý
  noteStep(x, y, ch) {
    if (ch === 'f' && ++state.rite.field >= 5) rite('field');
    const sides = state.rite.sides;
    if (x >= 14 && x <= 16) {
      if (y === 9) sides.add('n');
      if (y === 12) sides.add('s');
    }
    if (y === 10 || y === 11) {
      if (x === 13) sides.add('w');
      if (x === 17) sides.add('e');
    }
  }

  clearBubble(npc) { npc.bubble?.destroy(); npc.bubble = null; }

  update(_, dt) {
    if (state.busy || this.moving) return;
    let d = null;
    for (const code of held) if (DIRS[code]) d = DIRS[code];
    if (!d) {
      // Đứng im đủ lâu cạnh cái cây cháy cũng là một việc có người nhìn thấy
      const nearTree = Math.abs(this.px - 10) + Math.abs(this.py - 8) === 1;
      this.idle = state.chapter === 1 && nearTree ? this.idle + dt : 0;
      if (this.idle > 5000) rite('tree');
      return;
    }
    this.idle = 0;

    if (state.flipped) d = [d[0], -d[1]]; // ở mặt bên kia, lên xuống trên màn hình ngược với bản đồ

    this.facing = d;
    this.look(d);
    const nx = this.px + d[0];
    const ny = this.py + d[1];
    if ((nx < 0 || nx >= COLS) && this.grid[this.py][this.px] === 'G') {
      this.cross(nx < 0 ? COLS - 1 : 0);
      return;
    }
    const ch = this.grid[ny]?.[nx];
    if (state.chapter === 4 && (ch === 'P' || (ch === 'G' && !state.log4.includes('r2.mep.visit')))) {
      visitRound2Edge(nx);
      return;
    }
    if (ch === 'P') { held.clear(); edgeBump(); return; }
    if (this.propAt(nx, ny)) return;
    const blocker = this.npcAt(nx, ny);
    // Máy đang đi theo thì không chắn đường: bạn bước vào ô của nó, nó lùi về ô bạn vừa rời
    if (!WALKABLE.has(ch) || (blocker && !(blocker.machine && state.hasMachine))) return;

    const ox = this.px;
    const oy = this.py;
    if (state.hasMachine) this.moveMachine(ox, oy);
    this.moving = true;
    this.px = nx; this.py = ny;
    this.player.setDepth(10 + ny);
    this.tweens.add({
      targets: this.player, x: nx * TILE, y: ny * TILE, duration: 130,
      onComplete: () => {
        this.moving = false;
        if (state.chapter === 1) this.noteStep(nx, ny, ch);
        if (ch === 'E') gate();
      },
    });
  }
}

async function intro() {
  // ?ch2=thunder.q,ti.sleep,pond.left : vào thẳng chương 2 với log chương 1 cho sẵn (để thử nội dung)
  setupEdgeTabs();
  const params = new URLSearchParams(location.search);
  // ?ch3=asked | signed | stood : vào thẳng chương 3, cả ba nhà cùng ở một trạng thái sau chương 2
  const skip3 = params.get('ch3');
  if (skip3 !== null) {
    state.log = ['thunder.q', 'ti.sleep', 'pond.a1', 'lanh.pass'];
    state.chapter = 2;
    for (const id of state.log.slice(1)) {
      ch2Debate(id);
      if (skip3 === 'stood') { pushLog(`${id}.stand`); continue; }
      debateState(id).resolved = skip3 === 'signed' ? 'a' : 'q';
      pushLog(skip3 === 'signed' ? `${id}.own` : `${id}.fall`);
    }
    pushLog(skip3 === 'asked' ? 'boss.q' : 'boss.left');
    await enterChapter3();
    return;
  }
  // ?r2 : vào thẳng vòng hai với di sản đã lưu; ?r2=demo hoặc ?r2=blank dùng di sản mẫu
  const r2 = params.get('r2');
  if (r2 !== null) {
    await enterRound2(r2 === 'blank' ? BLANK_LEGACY : r2 === 'demo' ? DEMO_LEGACY : (loadLegacy() ?? DEMO_LEGACY));
    return;
  }
  const skip = params.get('ch2');
  if (skip !== null) {
    state.log = skip.split(',').filter((id) => ECHO[id]);
    if (!firstEcho('thunder')) state.log.unshift('thunder.left');
    if (!firstEcho('pond')) state.log.push('pond.left');
    await enterChapter2();
    return;
  }
  const L = loadLegacy();
  const pick = await screen(
    `<h1>VI HÀNH</h1>
     <div class="sub">Sấm · Bìa Vàng · Công Cụ</div>
     <p>Đám Đấng Sáng Tạo nhờ bạn xuống xem sản phẩm của chúng. Quy tắc cứng: bạn không được sửa thế giới, chỉ được nói chuyện.</p>
     <p>Thị trấn này đang sợ sấm, và sắp tế một con dê.</p>
     <p>Bạn có thể <b>hỏi</b> hoặc <b>khẳng định</b>. Cả hai đều được ghi lại.</p>`
    + (L ? '<p class="legacy-note">Thị trấn bạn để lại lần trước vẫn còn đó. Bạn có thể xuống làm Thầy từ đầu, hoặc sinh ra làm một đứa trẻ lớn lên giữa những lời mình đã nói.</p>' : ''),
    L ? ['Xuống làm Thầy', 'Vòng hai: sinh ra ở thị trấn ấy'] : 'Xuống',
  );
  if (L && pick === 1) { await enterRound2(L); return; }
  state.busy = false;
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COLS * TILE,
  height: ROWS * TILE,
  pixelArt: true,
  backgroundColor: '#14120f',
  input: { keyboard: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // ?timer: chạy vòng lặp bằng setTimeout, dùng khi tab bị trình duyệt bóp requestAnimationFrame
  ...(location.search.includes('timer') ? { fps: { forceSetTimeOut: true, target: 60 } } : {}),
  scene: Town,
});

window.__vihanh = { state, get scene() { return scene; }, endChapter, saveLegacy };
