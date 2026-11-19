import {
  TILE, COLS, ROWS, MAP, WALKABLE, START, NPCS, TALKS, DEBATES, ECHO, VERDICTS,
} from './data.js';
import { CH2, ALLY, BOSS, VERDICTS2 } from './chapter2.js';
import { NPCS3, FAMILY_LINE, CH3, MAKER, MACHINE, EDGE, FINALE, VERDICTS3 } from './chapter3.js';

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
  const frame = who === 'Bạn' ? CAST.c_player : npc?.sprite.frame.name;
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

function closeDialog() { dialog.hidden = true; }

function screen(html, btn = 'Tiếp tục') {
  return new Promise((resolve) => {
    held.clear();
    const el = $('screen');
    el.innerHTML = `${html}<button id="scr-btn">${esc(btn)} ⏎</button>`;
    el.hidden = false;
    el.scrollTop = 0;
    const done = () => { keyHandler = null; el.hidden = true; resolve(); };
    keyHandler = (e) => { if (!e.repeat && (e.code === 'Enter' || e.code === 'Space')) done(); };
    $('scr-btn').onclick = done;
  });
}

// ───────────────────────── Log Vũ Trụ ─────────────────────────

const curLog = () => [null, state.log, state.log2, state.log3][state.chapter];
function pushLog(id) { if (!curLog().includes(id)) curLog().push(id); }
const totalCertainty = (list) => list.reduce((n, id) => n + ECHO[id].cc, 0);
// Lời đầu tiên bạn để lại ở chương 1 về một chủ đề (thunder, ti, pond, lanh)
const firstEcho = (topic) => state.log.find((id) => id.startsWith(`${topic}.`));

async function showRawLog() {
  state.busy = true;
  const items = curLog().map((id) => {
    const e = ECHO[id];
    return `<div class="e"><div class="verb">${esc(e.verb)}</div><div class="said">“${esc(e.said)}”</div></div>`;
  }).join('');
  await screen(
    `<h2>Log Vũ Trụ</h2><p class="sub">Những gì bạn đã để lại ở thị trấn này. Chưa ai chép lại. Chưa.</p>`
    + (items ? `<div class="log">${items}</div>` : '<p>Trống. Bạn chưa nói gì đáng chép.</p>'),
    'Đóng',
  );
  state.busy = false;
}

function echoLogHtml(list, title, verdicts) {
  const items = list.map((id) => {
    const e = ECHO[id];
    return `<div class="e">
      <div class="verb">${esc(e.verb)}</div>
      <div class="said">“${esc(e.said)}”</div>
      <div class="now">${esc(id === 'edge.assert' && list.includes('edge.glue') ? EDGE.assertThenGlue : e.now)}</div>
      <div class="cc">Chắc Chắn +${e.cc}</div>
    </div>`;
  }).join('');
  const total = totalCertainty(list);
  const verdict = verdicts.find((v) => total <= v.max).text;
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
    if (pat > 0 && qs.length) menu.push({ k: 'q', label: 'Hỏi', hint: 'tốn 1 Kiên Nhẫn' });
    if (as.length) menu.push({ k: 'a', label: d.assertLabel ?? 'Khẳng định', hint: d.assertHint ?? `−${d.assertDmg} Chắc Chắn, và người ta sẽ chép lại` });
    menu.push({ k: 'l', label: 'Bỏ đi' });
    const prompt = pat > 0 ? 'Bạn làm gì?' : 'Bạn hết kiên nhẫn để hỏi tiếp.';
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

function ch2Debate(id) {
  const c = CH2[id];
  if (!c) return null;
  if (ch2Cache[id]) return ch2Cache[id];

  const who = NPCS[2].find((n) => n.topic === id.split('.')[0]).name;
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
    certainty: c.certainty,
    patience: c.patience,
    assertDmg: 5,
    intro: [[who, ECHO[id].line], [who, c.intro2]],
    again: [[who, 'Lại ông. Lệ vẫn thế.']],
    questions: c.questions,
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
  const legacy = totalCertainty(state.log.filter((id) => id.startsWith('thunder.')));
  const parts = [`nền 5`, `chuyện sấm ngày xưa +${legacy}`];
  if (standing) parts.push(`giáo điều còn đứng +${standing * 2}`);
  if (spoken) parts.push(`lời bạn vừa phán +${spoken * 3}`);
  return {
    id: 'boss',
    doctrine: BOSS.doctrine,
    certainty: 5 + legacy + standing * 2 + spoken * 3,
    patience: 4 + w.length,
    note: `Chắc Chắn: ${parts.join(', ')}. Người đứng cạnh bạn: ${w.length}.`,
    assertHint: 'bạn biết rõ mình là ai mà',
    questionsOnly: true,
    intro: [[who, ECHO[firstEcho('thunder')].line], [who, BOSS.intro2]],
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
  $('hud-ch').textContent = ['', 'Chương 1: Sấm', 'Chương 2: Bìa Vàng', 'Chương 3: Công Cụ'][state.chapter];
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
  await screen(`<p class="big">${esc(lead)}</p>`);
  await screen(echoLogHtml(state.log3, 'Log Vũ Trụ — lần cuối', VERDICTS3), 'Tiếp tục');
  await screen(
    `<h2>Hết</h2>
     <p>${esc(FINALE.epilogues[state.log3.find((id) => id.startsWith('end.'))] ?? FINALE.epilogues.gate)}</p>
     <p class="sub">Thử chơi lại từ đầu và nói khác đi: mỗi chương dễ hay khó là do chương trước bạn đã nói gì.</p>`,
    'Chơi lại',
  );
  location.href = location.pathname + (location.search.includes('timer') ? '?timer' : '');
}

// ───────────────────────── Kịch bản NPC ─────────────────────────

async function talkTo(npc) {
  if (npc.goat) {
    let line = 'Be.';
    if (state.chapter === 3) line = 'Máy nói. Con dê nhai nốt ngọn cỏ.';
    if (state.chapter === 2) {
      if (state.log.includes('thunder.left')) line = '(Con dê nhìn bạn rất lâu.)';
      else if (state.log.includes('thunder.a2')) line = '(Con dê đeo một cái thẻ: VẬT THIÊNG — CẤM NHÌN KHI CHƯA CÓ PHÉP.)';
    }
    await say(line === 'Be.' ? npc.name : '', line);
    return;
  }

  if (state.chapter === 2) { await talkCh2(npc); return; }
  if (state.chapter === 3) { await talkCh3(npc); return; }

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
  const npc = scene.npcAt(scene.px + scene.facing[0], scene.py + scene.facing[1]);
  if (!npc) return;
  state.busy = true;
  await talkTo(npc);
  state.talked.add(npc.id);
  scene.clearBubble(npc);
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
  for (const d of Object.values(DEBATES)) {
    if (!debateState(d.id).resolved) pushLog(d.echoLeft);
  }
  await screen('<p class="big">Ba thế hệ sau…</p>');
  await screen(echoLogHtml(state.log, 'Log Vũ Trụ — ba thế hệ sau', VERDICTS), 'Vào thị trấn');
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
  await screen(echoLogHtml(state.log2, 'Log Vũ Trụ — sáu thế hệ sau', VERDICTS2), 'Vào thị trấn');
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
    if (!state.crossed) { state.crossed = true; finale(); }
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
    this.npcs = NPCS[n].map((def) => {
      const tagged = n === 2 && def.goat && state.log.includes('thunder.a2') && !state.log.includes('thunder.left');
      const sprite = this.add.image(def.x * TILE, def.y * TILE, 'cast', CAST[tagged ? 'c_goat_tag' : def.tex]).setOrigin(0).setDepth(10 + def.y);
      let bubble = null;
      if (!def.goat && !def.machine) {
        bubble = this.add.image(def.x * TILE + 16, def.y * TILE - 8, 'bubble').setDepth(400);
        this.tweens.add({ targets: bubble, y: '-=4', duration: 500, yoyo: true, repeat: -1 });
      }
      return { ...def, sprite, bubble };
    });

    if (n === 2) {
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
      facePlayer(this.player, this.facing);
    }
    setHud();
  }

  npcAt(x, y) { return this.npcs.find((o) => o.x === x && o.y === y); }

  clearBubble(npc) { npc.bubble?.destroy(); npc.bubble = null; }

  update() {
    if (state.busy || this.moving) return;
    let d = null;
    for (const code of held) if (DIRS[code]) d = DIRS[code];
    if (!d) return;

    if (state.flipped) d = [d[0], -d[1]]; // ở mặt bên kia, lên xuống trên màn hình ngược với bản đồ

    this.facing = d;
    facePlayer(this.player, d);
    const nx = this.px + d[0];
    const ny = this.py + d[1];
    if (state.glued && (nx < 0 || nx >= COLS)) { this.cross(nx < 0 ? COLS - 1 : 0); return; }
    const ch = this.grid[ny]?.[nx];
    if (ch === 'P') { held.clear(); edgeBump(); return; }
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
  const skip = params.get('ch2');
  if (skip !== null) {
    state.log = skip.split(',').filter((id) => ECHO[id]);
    if (!firstEcho('thunder')) state.log.unshift('thunder.left');
    if (!firstEcho('pond')) state.log.push('pond.left');
    await enterChapter2();
    return;
  }
  await screen(
    `<h1>VI HÀNH</h1>
     <div class="sub">Sấm · Bìa Vàng · Công Cụ</div>
     <p>Đám Đấng Sáng Tạo nhờ bạn xuống xem sản phẩm của chúng. Quy tắc cứng: bạn không được sửa thế giới, chỉ được nói chuyện.</p>
     <p>Thị trấn này đang sợ sấm, và sắp tế một con dê.</p>
     <p>Bạn có thể <b>hỏi</b> hoặc <b>khẳng định</b>. Cả hai đều được ghi lại.</p>`,
    'Xuống',
  );
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

window.__vihanh = { state, get scene() { return scene; } };
