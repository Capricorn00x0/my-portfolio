// Nav toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// Mini terminal (home page)
const termInput = document.getElementById('termInput');
const termOutput = document.getElementById('termOutput');
const routes = {
  help: 'Available: home, work, about, blog, guides, uses, now, contact, games, color, resume, clear',
  home: '→ ~/home (you are here on index.html)',
  work: '→ opening ~/work ...',
  about: '→ opening ~/about ...',
  blog: '→ opening ~/blog ...',
  guides: '→ opening ~/guides ...',
  uses: '→ opening ~/uses ...',
  now: '→ opening ~/now ...',
  contact: '→ opening ~/contact ...',
  games: 'Pick one: guess (1-100) · ttt (tic-tac-toe) · snake (WASD) · pacman (maze). Type the name, press any key, quit to stop.',
  resume: '→ resume.pdf (add your PDF later)',
};
const pageFor = { about: 'about.html', work: 'work.html', blog: 'blog.html', guides: 'guides.html', uses: 'uses.html', now: 'now.html', contact: 'contact.html' };

if (termInput && termOutput) {
  // Plain-text only: never HTML, never eval. Script-like input is ignored.
  const blocked = /[<>&`${}]|javascript:|data:|vbscript:|on\w+\s*=|\bscript\b|&#|%3c|%3e/i;
  const say = (t) => { termOutput.textContent += '\n' + t; termOutput.scrollTop = termOutput.scrollHeight; };
  let activeGame = null;
  const gameScreen = document.getElementById('gameScreen');
  const showGame = (t) => { if (gameScreen) { gameScreen.hidden = false; gameScreen.textContent = t; } else say(t); };
  const endGame = (msg) => { if (activeGame && activeGame.timer) clearInterval(activeGame.timer); activeGame = null; if (gameScreen) { gameScreen.hidden = true; gameScreen.textContent = ''; } if (msg) say(msg); };

  // Command history (Up/Down arrows, like a real terminal).
  const cmdHistory = [];
  let histIdx = -1;
  const recordCmd = (cmd) => {
    if (cmdHistory[cmdHistory.length - 1] !== cmd) cmdHistory.push(cmd);
    if (cmdHistory.length > 50) cmdHistory.shift();
    histIdx = -1;
  };

  // Terminal themes: fixed allowlist only — no arbitrary CSS, nothing executable.
  const COLORS = { green: '#33d17a', amber: '#ffb86b', cyan: '#4cc9f0', red: '#ff5d5d', pink: '#f471b5', white: '#d6e2ec' };
  const applyColor = (name) => {
    const hex = COLORS[name];
    if (!hex) return false;
    [termOutput, gameScreen, termInput].forEach((el) => { if (el) el.style.color = hex; });
    try { localStorage.setItem('termColor', name); } catch (_) {}
    return true;
  };
  try { const saved = localStorage.getItem('termColor'); if (saved && COLORS[saved]) applyColor(saved); } catch (_) {}

  // Focus rules: keys drive the game only while the terminal has focus.
  // Click outside → website behaves normally (game state kept).
  // Click back in → realtime games resume where they paused, turn games wait as-is.
  termInput.addEventListener('focus', () => {
    if (activeGame && activeGame.realtime && activeGame.paused) {
      activeGame.paused = false;
      showGame(activeGame.screen());
    }
  });
  termInput.addEventListener('blur', () => {
    if (activeGame && activeGame.realtime && !activeGame.paused) {
      activeGame.paused = true;
      showGame('PAUSED — click the terminal to resume.\n' + activeGame.screen());
    }
  });

  // --- guess the number (1-100, 7 tries) ---
  const guessScreen = () => 'GUESS 1-100 · tries left: ' + activeGame.tries + '\n' + activeGame.msg;
  const startGuess = () => {
    activeGame = { type: 'guess', ready: true, n: 1 + Math.floor(Math.random() * 100), tries: 7, msg: '' };
    say('$ guess');
    showGame('GUESS 1-100 · press any key to start (Ctrl+C to cancel).');
  };
  const playGuess = (cmd) => {
    if (cmd === 'quit' || cmd === 'exit') { endGame('Guess over — the number was ' + activeGame.n + '.'); return; }
    const g = parseInt(cmd, 10);
    if (!Number.isInteger(g) || g < 1 || g > 100) { activeGame.msg = 'Numbers 1-100 only (or quit).'; showGame(guessScreen()); return; }
    activeGame.tries--;
    if (g === activeGame.n) { const used = 7 - activeGame.tries; endGame('Correct! ' + g + ' in ' + used + (used === 1 ? ' try.' : ' tries.') + ' GG.'); return; }
    if (activeGame.tries <= 0) { endGame('Out of tries — it was ' + activeGame.n + '. Type guess to retry.'); return; }
    activeGame.msg = (g < activeGame.n ? 'Higher' : 'Lower') + ' — ' + activeGame.tries + ' left.';
    showGame(guessScreen());
  };

  // --- tic-tac-toe (you are X, computer is O) ---
  const tttRender = (b) => {
    const c = (i) => (b[i] === ' ' ? String(i + 1) : b[i]);
    return c(0) + ' | ' + c(1) + ' | ' + c(2) + '\n--+---+--\n' + c(3) + ' | ' + c(4) + ' | ' + c(5) + '\n--+---+--\n' + c(6) + ' | ' + c(7) + ' | ' + c(8);
  };
  const tttWin = (b, p) => [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some((l) => l.every((i) => b[i] === p));
  const tttTake = (b, p) => { for (let i = 0; i < 9; i++) { if (b[i] === ' ') { b[i] = p; const w = tttWin(b, p); b[i] = ' '; if (w) return i; } } return -1; };
  const tttScreen = (msg) => msg + '\n' + tttRender(activeGame.b);
  const startTtt = () => {
    activeGame = { type: 'ttt', ready: true, b: [] };
    say('$ ttt');
    showGame('TIC-TAC-TOE · press any key to start (Ctrl+C to cancel).');
  };
  const playTtt = (cmd) => {
    const b = activeGame.b;
    if (cmd === 'quit' || cmd === 'exit') { endGame('Tic-tac-toe over — thanks for playing.'); return; }
    const m = parseInt(cmd, 10);
    if (!Number.isInteger(m) || m < 1 || m > 9 || b[m - 1] !== ' ') { showGame(tttScreen('Free cells 1-9 only (or quit).')); return; }
    b[m - 1] = 'X';
    if (tttWin(b, 'X')) { endGame('You win!\n' + tttRender(b)); return; }
    if (!b.includes(' ')) { endGame('Draw!\n' + tttRender(b)); return; }
    let o = tttTake(b, 'O');
    if (o < 0) o = tttTake(b, 'X');
    if (o < 0) { const free = b.map((v, i) => (v === ' ' ? i : -1)).filter((i) => i >= 0); o = free[Math.floor(Math.random() * free.length)]; }
    b[o] = 'O';
    if (tttWin(b, 'O')) { endGame('I win this one.\n' + tttRender(b)); return; }
    if (!b.includes(' ')) { endGame('Draw!\n' + tttRender(b)); return; }
    showGame(tttScreen('Your move (1-9).'));
  };

  // --- snake (ASCII, steer with WASD / arrows) ---
  const SW = 14, SH = 10;
  const snakeHelp = () => 'Steer with WASD / arrows. Type quit + Enter to stop.\n';
  const snakeRender = (g) => {
    const rows = [];
    for (let y = 0; y < SH; y++) {
      let r = '';
      for (let x = 0; x < SW; x++) {
        if (x === g.food.x && y === g.food.y) r += '@';
        else { const i = g.body.findIndex((s) => s.x === x && s.y === y); r += i < 0 ? ' ' : (i === 0 ? 'O' : 'o'); }
      }
      rows.push('#' + r + '#');
    }
    return 'score ' + g.score + '\n' + '#'.repeat(SW + 2) + '\n' + rows.join('\n') + '\n' + '#'.repeat(SW + 2);
  };
  const snakeFood = (g) => {
    for (;;) {
      const f = { x: Math.floor(Math.random() * SW), y: Math.floor(Math.random() * SH) };
      if (!g.body.some((s) => s.x === f.x && s.y === f.y)) return f;
    }
  };
  const newSnake = () => {
    const g = { type: 'snake', ready: true, realtime: true, speed: 240, paused: false, timer: 0, score: 0,
      body: [{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }], dx: 1, dy: 0, food: null };
    g.food = snakeFood(g);
    g.screen = () => snakeHelp() + snakeRender(g);
    return g;
  };
  const startSnake = () => {
    activeGame = newSnake();
    say('$ snake');
    showGame('SNAKE · press any key to start (Ctrl+C to cancel).\n' + snakeRender(activeGame));
  };
  const stepSnake = (g) => {
    const h = { x: g.body[0].x + g.dx, y: g.body[0].y + g.dy };
    if (h.x < 0 || h.y < 0 || h.x >= SW || h.y >= SH || g.body.some((s) => s.x === h.x && s.y === h.y)) {
      endGame('Snake died — score ' + g.score + '. Type snake to retry.');
      return;
    }
    g.body.unshift(h);
    if (h.x === g.food.x && h.y === g.food.y) { g.score++; g.food = snakeFood(g); }
    else g.body.pop();
    showGame(g.screen());
  };

  // --- pacman (ASCII maze: C = you, G = ghosts, . = dots) ---
  const PW = 19, PH = 11;
  const PILLARS = [[3,2],[7,2],[11,2],[15,2],[5,4],[13,4],[9,3],[9,7],[3,6],[15,6],[5,8],[13,8]];
  const pacWall = (x, y) => x <= 0 || y <= 0 || x >= PW - 1 || y >= PH - 1 || PILLARS.some((p) => p[0] === x && p[1] === y);
  const pacHelp = () => 'Eat all dots, dodge the ghosts. WASD / arrows move. quit + Enter stops.\n';
  const pacRender = (g) => {
    const rows = [];
    for (let y = 0; y < PH; y++) {
      let r = '';
      for (let x = 0; x < PW; x++) {
        if (pacWall(x, y)) r += '#';
        else if (g.px === x && g.py === y) r += 'C';
        else if (g.ghosts.some((gh) => gh.x === x && gh.y === y)) r += 'G';
        else if (g.dots.has(x + ',' + y)) r += '.';
        else r += ' ';
      }
      rows.push(r);
    }
    return 'score ' + g.score + ' · dots left ' + g.dots.size + '\n' + rows.join('\n');
  };
  const newPac = () => {
    const dots = new Set();
    for (let y = 1; y < PH - 1; y++) for (let x = 1; x < PW - 1; x++) {
      if (!pacWall(x, y) && !(x === 9 && y === 5) && !(x === 1 && y === 1) && !(x === 17 && y === 9)) dots.add(x + ',' + y);
    }
    const g = { type: 'pacman', ready: true, realtime: true, speed: 200, paused: false, timer: 0,
      px: 9, py: 5, dx: 0, dy: 0, score: 0, dots, ghosts: [{ x: 1, y: 1, dx: 1, dy: 0 }, { x: 17, y: 9, dx: -1, dy: 0 }] };
    g.screen = () => pacHelp() + pacRender(g);
    return g;
  };
  const startPac = () => {
    activeGame = newPac();
    say('$ pacman');
    showGame('PACMAN · press any key to start (Ctrl+C to cancel).\n' + pacRender(activeGame));
  };
  const stepPac = (g) => {
    const nx = g.px + g.dx, ny = g.py + g.dy;
    if ((g.dx || g.dy) && !pacWall(nx, ny)) { g.px = nx; g.py = ny; }
    const k = g.px + ',' + g.py;
    if (g.dots.has(k)) { g.dots.delete(k); g.score++; }
    for (const gh of g.ghosts) {
      const opts = [[0,-1],[0,1],[-1,0],[1,0]].filter((d) => !pacWall(gh.x + d[0], gh.y + d[1]));
      if (!opts.length) continue;
      const straight = opts.filter((d) => d[0] !== -gh.dx || d[1] !== -gh.dy);
      const pool = straight.length ? straight : opts;
      let best = pool[0], bestD = Infinity;
      if (Math.random() < 0.55) {
        for (const d of pool) {
          const dist = Math.abs(gh.x + d[0] - g.px) + Math.abs(gh.y + d[1] - g.py);
          if (dist < bestD) { bestD = dist; best = d; }
        }
      } else best = pool[Math.floor(Math.random() * pool.length)];
      gh.dx = best[0]; gh.dy = best[1];
      gh.x += gh.dx; gh.y += gh.dy;
    }
    if (g.ghosts.some((gh) => gh.x === g.px && gh.y === g.py)) {
      endGame('Caught! Score ' + g.score + '. Type pacman to retry.');
      return;
    }
    if (g.dots.size === 0) { endGame('Board cleared! Score ' + g.score + '. GG.'); return; }
    showGame(g.screen());
  };

  // Shared realtime loop + press-any-key start for every game.
  const dirOf = (k) => ({ arrowup: [0,-1], w: [0,-1], arrowdown: [0,1], s: [0,1], arrowleft: [-1,0], a: [-1,0], arrowright: [1,0], d: [1,0] })[String(k).toLowerCase()];
  const startLoop = (g) => {
    g.timer = setInterval(() => {
      if (activeGame !== g) { clearInterval(g.timer); return; }
      if (g.paused || g.ready) return;
      if (g.type === 'snake') stepSnake(g);
      else if (g.type === 'pacman') stepPac(g);
    }, g.speed);
  };
  const beginGame = (d) => {
    const g = activeGame;
    if (!g || !g.ready) return;
    if (g.type === 'guess') { g.ready = false; g.tries = 7; g.msg = 'Type a number (or quit).'; showGame(guessScreen()); }
    else if (g.type === 'ttt') { g.ready = false; g.b = Array(9).fill(' '); showGame(tttScreen('You are X. Type 1-9 to move (or quit).')); }
    else if (g.type === 'snake') { activeGame = newSnake(); activeGame.ready = false; showGame(activeGame.screen()); startLoop(activeGame); }
    else if (g.type === 'pacman') {
      activeGame = newPac(); activeGame.ready = false;
      if (d) { activeGame.dx = d[0]; activeGame.dy = d[1]; }
      showGame(activeGame.screen()); startLoop(activeGame);
    }
  };

  termInput.addEventListener('keydown', (e) => {
    // Ctrl+C / Cmd+C interrupts like a real terminal (but never steals a copy).
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (termInput.selectionStart !== termInput.selectionEnd) return;
      e.preventDefault();
      termInput.value = '';
      if (activeGame) endGame('^C — stopped.');
      else say('^C');
      return;
    }
    if (activeGame && activeGame.ready) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (!(k === 'Enter' || k.length === 1 || k.indexOf('Arrow') === 0)) return;
      e.preventDefault();
      beginGame(dirOf(k));
      return;
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !(activeGame && activeGame.realtime && !activeGame.ready)) {
      e.preventDefault();
      if (cmdHistory.length) {
        if (e.key === 'ArrowUp') histIdx = histIdx < 0 ? cmdHistory.length - 1 : Math.max(0, histIdx - 1);
        else histIdx = histIdx < 0 ? -1 : (histIdx + 1 >= cmdHistory.length ? -1 : histIdx + 1);
        termInput.value = histIdx < 0 ? '' : cmdHistory[histIdx];
        try { termInput.setSelectionRange(termInput.value.length, termInput.value.length); } catch (_) {}
      }
      return;
    }
    if (activeGame && activeGame.realtime && !activeGame.ready) {
      const d = dirOf(e.key);
      if (d) {
        e.preventDefault();
        if (activeGame.type === 'pacman' || d[0] !== -activeGame.dx || d[1] !== -activeGame.dy) { activeGame.dx = d[0]; activeGame.dy = d[1]; }
      }
    }
    if (e.key !== 'Enter') return;
    const raw = termInput.value.slice(0, 120);
    termInput.value = '';
    const cmd = raw.trim().toLowerCase().slice(0, 60);
    if (!cmd) return;
    recordCmd(cmd);
    if (cmd === 'clear') { endGame(); termOutput.textContent = ''; return; }
    if (activeGame) {
      if (blocked.test(cmd)) { say('ignored.'); return; }
      if (activeGame.type === 'guess') { playGuess(cmd); return; }
      if (activeGame.type === 'ttt') { playTtt(cmd); return; }
      if (cmd === 'quit' || cmd === 'exit') { endGame('Game stopped.'); return; }
      showGame(activeGame.screen());
      return;
    }
    if (blocked.test(cmd)) { termOutput.textContent += '\n$ ---\nignored — plain commands only (try help)'; return; }
    if (cmd === 'color' || cmd.indexOf('color ') === 0) {
      const name = cmd.slice(6).trim();
      if (!name) { say('$ color\nUsage: color green|amber|cyan|red|pink|white'); return; }
      if (applyColor(name)) say('Theme set: ' + name + '.');
      else say('Unknown theme. Try: color green|amber|cyan|red|pink|white');
      return;
    }
    if (cmd === 'games' || cmd === 'game') { say('$ games\n' + routes.games); return; }
    if (cmd === 'guess') { startGuess(); return; }
    if (cmd === 'ttt' || cmd === 'tictactoe' || cmd === 'tic-tac-toe') { startTtt(); return; }
    if (cmd === 'snake') { startSnake(); return; }
    if (cmd === 'pacman' || cmd === 'pac') { startPac(); return; }
    const msg = routes[cmd] || `command not found: ${cmd} — try help`;
    termOutput.textContent += `\n$ ${cmd}\n${msg}`;
    termOutput.scrollTop = termOutput.scrollHeight;
    if (pageFor[cmd]) setTimeout(() => {
      const target = isHome ? homeSectionFor[pageFor[cmd]] : null;
      if (target && scrollToSection(target)) return;
      window.location.href = pageFor[cmd];
    }, 600);
  });
}

// Home page: nav / hero buttons scroll to the listed section below.
// Read more / Continue links (.read-more) still open the full page.
const homeSectionFor = { 'index.html': 'top', 'about.html': 'section-about', 'work.html': 'section-work', 'blog.html': 'section-blog', 'guides.html': 'section-guides', 'uses.html': 'section-uses', 'now.html': 'section-now', 'contact.html': 'section-contact' };
const isHome = !!document.getElementById('section-pages');
function scrollToSection(id) {
  if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return true; }
  const el = document.getElementById(id);
  if (!el) return false;
  el.classList.add('visible');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
if (isHome) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.classList.contains('read-more')) return;
    const href = a.getAttribute('href');
    if (!href || !href.endsWith('.html')) return;
    const target = homeSectionFor[href];
    if (!target) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (navLinks) navLinks.classList.remove('open');
    scrollToSection(target);
  }, true);
}

// Smooth page switching: fade out, then navigate (no snappy jumps)
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || /^https?:/i.test(href)) return;
    if (!href.endsWith('.html')) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 180);
  });
})();

// Always land on top after (re)load — never resume mid-page.
// Exception: an explicit #hash target (e.g. contact.html -> index.html#section-contact).
// One-shot: the hash is stripped right after the jump, so any later refresh goes to the top.
try { if (typeof history !== 'undefined' && 'scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (_) {}
let landed = false;
function jumpToHash() {
  if (landed) return; // runs at parse time and again on load — only the first call acts
  landed = true;
  try {
    const id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    const el = id ? document.getElementById(id) : null;
    if (el) {
      el.classList.add('visible');
      el.scrollIntoView({ block: 'start' });
      // Drop the hash so a later refresh lands on top, not on the section.
      try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
      return;
    }
    window.scrollTo(0, 0);
  } catch (_) {}
}
jumpToHash();
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('load', jumpToHash);

// Scroll reveal for home cards/sections
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('visible')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
})();

// ---------- Site life: boot, count-ups ----------
// Boot overlay (home only, once per session, click to skip).
(function () {
  const boot = document.getElementById('boot');
  if (!boot) return;
  const log = document.getElementById('bootLog');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seen = false;
  try { seen = sessionStorage.getItem('booted') === '1'; } catch (_) {}
  if (reduce || seen || !log) { boot.remove(); return; }
  boot.hidden = false;
  const lines = ['fahim-node v1.0 — secure boot', '[ok] vlan tables loaded', '[ok] 16 cameras online', '[ok] terminal ready — welcome'];
  let i = 0;
  const finish = () => {
    boot.classList.add('done');
    try { sessionStorage.setItem('booted', '1'); } catch (_) {}
    setTimeout(() => boot.remove(), 350);
  };
  const t = setInterval(() => {
    if (i >= lines.length) { clearInterval(t); finish(); return; }
    log.textContent += (i ? '\n' : '') + lines[i++];
  }, 140);
  boot.addEventListener('click', () => { clearInterval(t); finish(); });
  setTimeout(() => { if (document.getElementById('boot')) finish(); }, 4000);
})();

// Count-up metrics.
(function () {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (!Number.isFinite(target)) return;
    if (reduce || !window.requestAnimationFrame) { el.textContent = String(target); return; }
    const t0 = performance.now(), dur = 900;
    const frame = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
})();

// Contact form (contact page). Set FORMSPREE_ID to make it really send
// (free at formspree.io, e.g. 'abcdwxyz'); empty = demo mode.
const FORMSPREE_ID = '';
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Plain-text only: never reflected into HTML, never executed.
    const strip = (s, max) => s.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, max);
    const name = strip(document.getElementById('name').value, 80);
    const email = strip(document.getElementById('email').value, 120);
    const message = strip(document.getElementById('message').value, 2000);
    const status = document.getElementById('formStatus');
    const looksLikeCode = (s) => /[<>&]|javascript:|data:|vbscript:|on\w+\s*=|\bscript\b|&#|%3c|%3e/i.test(s);
    if (!name || !email || !message) { status.textContent = 'Please fill in all fields.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = 'Enter a valid email.'; return; }
    if (looksLikeCode(name) || looksLikeCode(email) || looksLikeCode(message)) { status.textContent = 'Plain text only — links, tags and code are not accepted.'; return; }
    if (!FORMSPREE_ID) { status.textContent = 'Thanks! Message noted.'; form.reset(); return; }
    status.textContent = 'Sending…';
    fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    }).then((r) => {
      if (r.ok) { status.textContent = 'Sent! I will get back to you.'; form.reset(); }
      else status.textContent = 'Send failed — try email instead.';
    }).catch(() => { status.textContent = 'Network error — try email instead.' });
  });
}
