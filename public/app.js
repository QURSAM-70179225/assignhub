// ===== AssignHub — public site interactions =====
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

let CONFIG = { whatsappNumber: '923107577751', whatsappDisplay: '0310-7577751', ownerName: 'Hafsa Ali', brandName: 'AssignHub' };
const waLink = (text) => `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;

// Service catalogue — names must match the server's SERVICES list
const SERVICES = [
  { name: 'Programming Assignment', ico: '💻', base: 1500, desc: 'C, C++, Java, Python, C# — OOP, DSA, problem solving with clean, commented code.', tags: ['C++', 'Java', 'Python', 'DSA'] },
  { name: 'AI / Machine Learning Project', ico: '🤖', base: 5000, desc: 'Classification, regression, NLP, computer vision, chatbots, model training & reports.', tags: ['scikit-learn', 'TensorFlow', 'NLP'] },
  { name: 'Web Development', ico: '🌐', base: 4000, desc: 'Responsive websites and full stack apps with frontend, backend and database.', tags: ['React', 'Node', 'PHP', 'Laravel'] },
  { name: 'Mobile App', ico: '📱', base: 6000, desc: 'Android & cross-platform apps with Flutter or Kotlin, Firebase integration.', tags: ['Flutter', 'Android', 'Firebase'] },
  { name: 'Database / SQL', ico: '🗄️', base: 2000, desc: 'ERD diagrams, normalization, SQL queries, stored procedures, DB projects.', tags: ['MySQL', 'SQL Server', 'MongoDB'] },
  { name: 'PPT Slides / Presentation', ico: '📊', base: 800, desc: 'Modern, clean slides for any subject — with speaker notes if you need them.', tags: ['PowerPoint', 'Canva', 'Any field'] },
  { name: 'Report / Documentation', ico: '📝', base: 1200, desc: 'Lab reports, project documentation, SRS, proposals — properly formatted.', tags: ['SRS', 'Proposals', 'Lab reports'] },
  { name: 'Final Year Project', ico: '🎓', base: 15000, desc: 'Complete FYP guidance: idea, implementation, documentation and viva prep.', tags: ['FYP', 'Full stack', 'AI'] },
  { name: 'Data Analysis / Excel', ico: '📈', base: 1500, desc: 'Excel formulas, dashboards, charts, Python/pandas data analysis.', tags: ['Excel', 'pandas', 'Power BI'] },
  { name: 'Other', ico: '✨', base: 1000, desc: 'Something else? Networking, OS, MATLAB, business subjects — just ask!', tags: ['Any subject'] },
];
const fmtRs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');

// ---------- Config ----------
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) CONFIG = { ...CONFIG, ...(await res.json()) };
  } catch { /* use defaults */ }
  $$('[data-brand]').forEach((el) => (el.textContent = CONFIG.brandName));
  $$('[data-owner]').forEach((el) => (el.textContent = CONFIG.ownerName));
  $$('[data-wa-display]').forEach((el) => (el.textContent = CONFIG.whatsappDisplay));
  $$('[data-wa]').forEach((el) => (el.href = waLink(el.dataset.wa)));
  document.title = `${CONFIG.brandName} — Assignment & Project Help`;
}

// ---------- Nav ----------
function initNav() {
  const nav = $('#nav');
  const links = $('#navLinks');
  $('#menuBtn').onclick = () => links.classList.toggle('open');
  $$('a', links).forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });

  const sections = $$('main section[id]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) $$('a', links).forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
}

// ---------- Hero typing + terminal ----------
function initTyping() {
  const words = ['coding assignments.', 'AI/ML projects.', 'full stack websites.', 'PPT presentations.', 'database projects.', 'your final year project.'];
  const el = $('#typed');
  let w = 0, i = 0, deleting = false;
  (function tick() {
    const word = words[w];
    el.textContent = word.slice(0, i);
    if (!deleting && i === word.length) { deleting = true; return setTimeout(tick, 1600); }
    if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; }
    i += deleting ? -1 : 1;
    setTimeout(tick, deleting ? 35 : 75);
  })();
}

function initTerminal() {
  const lines = [
    '<span class="c"># your deadline is tomorrow? relax 😎</span>',
    '<span class="k">from</span> student <span class="k">import</span> stress',
    '<span class="k">from</span> assignhub <span class="k">import</span> help',
    '',
    '<span class="k">def</span> <span class="f">finish_assignment</span>(task):',
    '    code = help.<span class="f">write</span>(task, clean=<span class="k">True</span>)',
    '    code.<span class="f">add_comments</span>()',
    '    code.<span class="f">explain</span>(to=<span class="s">"you"</span>)',
    '    <span class="k">return</span> code',
    '',
    'stress.<span class="f">level</span> = <span class="o">0</span>',
    '<span class="f">print</span>(<span class="s">"Grade: A+ 🎉"</span>)',
  ];
  const body = $('#termBody');
  let n = 0;
  (function next() {
    if (n > lines.length) { setTimeout(() => { n = 0; body.innerHTML = ''; next(); }, 4000); return; }
    body.innerHTML = lines.slice(0, n).join('\n') + (n < lines.length ? '\n<span class="o">▋</span>' : '\n\n<span class="o">&gt;&gt;&gt; Grade: A+ 🎉</span>');
    n++;
    setTimeout(next, 420);
  })();
}

// ---------- Reveal + counters ----------
function animateCount(el) {
  const target = Number(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const dur = 1400;
  (function step(t) {
    const p = Math.min(1, (t - start) / dur);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      $$('[data-count]', e.target).forEach(animateCount);
      io.unobserve(e.target);
    });
  }, { threshold: .12 });
  $$('.reveal').forEach((el) => {
    // Neighbouring items arrive one after another
    el.style.setProperty('--d', ([...el.parentElement.children].indexOf(el) % 4) * .09 + 's');
    io.observe(el);
  });
}
async function loadStats() {
  try {
    const s = await (await fetch('/api/stats')).json();
    const el = $('#statTotal');
    el.dataset.count = s.total;
    el.dataset.suffix = s.total ? '+' : '';
    if (el.closest('.visible')) animateCount(el);
  } catch { /* ignore */ }
}

// ---------- Scroll-based motion ----------
const clamp01 = (n) => Math.min(1, Math.max(0, n));

// Mouse-wheel scrolling glides instead of jumping. Touch, keyboard and scrollbar stay native.
function initSmoothWheel() {
  if (!matchMedia('(pointer: fine)').matches) return;
  let target = 0, pos = 0, running = false;
  const stop = () => { running = false; };
  function glide() {
    if (!running) return;
    pos += (target - pos) * .11;
    if (Math.abs(target - pos) < .5) { pos = target; running = false; }
    scrollTo({ top: pos, behavior: 'instant' });
    if (running) requestAnimationFrame(glide);
  }
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if ($('.modal.open')) return;
    const box = e.target.closest && e.target.closest('textarea');
    if (box && box.scrollHeight > box.clientHeight) return;
    e.preventDefault();
    if (!running) target = pos = scrollY;
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1;
    target = Math.min(document.documentElement.scrollHeight - innerHeight, Math.max(0, target + e.deltaY * unit));
    if (!running) { running = true; requestAnimationFrame(glide); }
  }, { passive: false });
  addEventListener('pointerdown', stop);
  addEventListener('keydown', stop);
}

function splitHeadings() {
  $$('.section-head h2, .order-info h2, .cta h2').forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', words.join(' '));
    h.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i);
      span.setAttribute('aria-hidden', 'true');
      span.textContent = word;
      h.append(span, ' ');
    });
  });
}

function initScrollFx() {
  const bar = $('#scrollBar'), steps = $('#steps'), fill = $('#stepsFill');
  const stepEls = $$('.step', steps);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) stepEls.forEach((s) => s.classList.add('lit'));
  else { splitHeadings(); initSmoothWheel(); }

  const docTop = (el) => { let y = 0; for (; el; el = el.offsetParent) y += el.offsetTop; return y; };
  const wide = matchMedia('(min-width: 981px)');
  const hero = { inner: $('.hero-inner'), text: $('.hero-text'), visual: $('.hero-visual'), term: $('#terminal') };
  const floats = [[$('.f1'), .16], [$('.f2'), .12], [$('.f3'), .08]];
  const track = $('.marquee-track');
  const orbs = $$('.orb'), ring = $('.ring');
  let items = [], stepsBox = { top: 0, h: 1 }, vh = innerHeight, cur = scrollY, raf = 0;

  // through: 0 as an element enters from the bottom, 1 as it leaves at the top
  // enter:   0 as it enters, 1 once it has climbed 70% of the screen
  function measure() {
    items.forEach(({ el }) => { el.style.transform = ''; });
    items = [];
    vh = innerHeight;
    stepsBox = { top: docTop(steps), h: steps.offsetHeight };
    const add = (el, fn) => items.push({ el, fn, top: docTop(el), h: el.offsetHeight });
    add($('.cta'), (el, p) => { el.style.transform = `scale(${.93 + .07 * p.enter})`; });
    if (wide.matches) {
      $$('.section-head').forEach((el) => add(el, (e, p) => { e.style.transform = `translateY(${(.5 - p.through) * 56}px)`; }));
      $$('.stat').forEach((el, i) => add(el, (e, p) => { e.style.transform = `translateY(${(.5 - p.through) * [24, 52, 34, 64][i]}px)`; }));
      $$('.fun-card').forEach((el, i) => add(el, (e, p) => { e.style.transform = `translateY(${(.5 - p.through) * [44, 0, -44][i]}px)`; }));
      add($('.estimator'), (el, p) => { el.style.transform = `scale(${.95 + .05 * p.enter})`; });
    } else {
      [hero.text, hero.visual, hero.term].forEach((el) => { el.style.transform = ''; });
      hero.inner.style.opacity = '';
      floats.forEach(([el]) => { el.style.translate = ''; });
    }
  }

  function write() {
    const y = cur;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const page = clamp01(y / max);
    bar.style.transform = `scaleX(${clamp01(scrollY / max)})`;

    const lit = clamp01((y + vh * .8 - stepsBox.top) / (vh * .45 + stepsBox.h * .5));
    fill.style.transform = `scaleX(${lit})`;
    if (calm) return;
    stepEls.forEach((s, i) => s.classList.toggle('lit', lit >= i / stepEls.length + .04));

    orbs[0].style.transform = `translate3d(${-14 * page}vw, ${70 * page}vh, 0) scale(${1 + .2 * page})`;
    orbs[0].style.opacity = 1 - .65 * page;
    orbs[1].style.transform = `translate3d(${22 * page}vw, ${35 * page}vh, 0)`;
    orbs[2].style.transform = `translate3d(${-16 * page}vw, ${-45 * page}vh, 0) scale(${1 + .15 * page})`;
    orbs[2].style.opacity = .25 + .75 * page;
    orbs[3].style.transform = `translate3d(${18 * page}vw, ${-30 * page}vh, 0)`;
    orbs[3].style.opacity = .25 + .75 * page;
    ring.style.transform = `translate3d(${-34 * page}vw, ${30 * page}vh, 0) rotate(${page * 200}deg) scale(${1 + .25 * page})`;

    if (y < vh * 1.3) {
      track.style.translate = `${-y * .22}px 0`;
      if (wide.matches) {
        const k = clamp01(y / (vh * .55));
        hero.inner.style.opacity = 1 - clamp01((y - vh * .3) / (vh * .7));
        hero.text.style.transform = `translateY(${y * .16}px)`;
        hero.visual.style.transform = `translateY(${y * .06}px)`;
        hero.term.style.transform = `perspective(900px) rotateY(${-8 * (1 - k)}deg) rotateX(${4 * (1 - k)}deg)`;
        floats.forEach(([el, rate]) => { el.style.translate = `0 ${-y * rate}px`; });
      }
    }

    items.forEach(({ el, fn, top, h }) => {
      if (y + vh < top - 200 || y > top + h + 200) return;
      fn(el, { through: clamp01((y + vh - top) / (vh + h)), enter: clamp01((y + vh - top) / (vh * .7)) });
    });
  }

  function frame() {
    cur += (scrollY - cur) * .14;
    if (Math.abs(scrollY - cur) < .2) cur = scrollY;
    write();
    raf = cur === scrollY ? 0 : requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', wake, { passive: true });
  const refresh = () => { measure(); write(); };
  new ResizeObserver(refresh).observe(document.body);
  addEventListener('resize', refresh);
  refresh();
}

// ---------- Services ----------
function initServices() {
  const grid = $('#servicesGrid');
  grid.innerHTML = SERVICES.map((s) => `
    <article class="service reveal" data-service="${s.name}" tabindex="0">
      <span class="from">from ${fmtRs(s.base)}</span>
      <span class="ico">${s.ico}</span>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="tags">${s.tags.map((t) => `<span>${t}</span>`).join('')}</div>
    </article>`).join('');

  const opts = SERVICES.map((s) => `<option value="${s.name}">${s.ico} ${s.name}</option>`).join('');
  $('#serviceSelect').innerHTML = '<option value="">Choose a service…</option>' + opts;
  $('#estService').innerHTML = opts;

  $$('.service', grid).forEach((card) => {
    const pick = () => {
      $('#serviceSelect').value = card.dataset.service;
      $('#serviceSelect').dispatchEvent(new Event('change', { bubbles: true }));
      $('#order').scrollIntoView();
      toast(`${card.dataset.service} selected — fill in the details below 👇`);
    };
    card.addEventListener('click', pick);
    card.addEventListener('keydown', (e) => e.key === 'Enter' && pick());
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      card.style.transform = `perspective(800px) rotateX(${(r.height / 2 - y) / 40}deg) rotateY(${(x - r.width / 2) / 40}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => (card.style.transform = ''));
  });
}

// ---------- Price estimator ----------
function initEstimator() {
  const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
  const sizeMult = [0.6, 0.8, 1, 1.6, 2.4];
  const svc = $('#estService'), size = $('#estSize'), days = $('#estDays'), explain = $('#estExplain');
  let lastText = '';
  function calc() {
    const s = SERVICES.find((x) => x.name === svc.value) || SERVICES[0];
    const d = Number(days.value);
    const urgency = d <= 1 ? 1.8 : d <= 2 ? 1.5 : d <= 4 ? 1.25 : d <= 7 ? 1.1 : 1;
    let price = s.base * sizeMult[size.value - 1] * urgency * (explain.checked ? 1.2 : 1);
    const low = Math.round(price * 0.85 / 100) * 100, high = Math.round(price * 1.15 / 100) * 100;
    $('#estSizeLabel').textContent = sizes[size.value - 1];
    $('#estDaysLabel').textContent = d === 1 ? '24 hours ⚡' : d + ' days';
    $('#estPrice').textContent = `${fmtRs(low)} – ${fmtRs(high).replace('Rs ', '')}`;
    $('#estMeter').style.width = Math.min(100, (price / 30000) * 100 + 8) + '%';
    $('#estNote').textContent = urgency > 1 ? `Includes ${Math.round((urgency - 1) * 100)}% urgent-delivery charge` : 'No rush fee — nice planning! 🧘';
    lastText = `${fmtRs(low)} – ${fmtRs(high)}`;
  }
  [svc, size, days, explain].forEach((el) => el.addEventListener('input', calc));
  calc();
  $('#estUse').onclick = () => {
    $('#serviceSelect').value = svc.value;
    $('#estimateInput').value = lastText;
    const due = new Date(Date.now() + Number(days.value) * 864e5);
    $('[name="deadline"]').value = toLocalInput(due);
    $('#orderForm').dispatchEvent(new Event('input'));
    $('#order').scrollIntoView();
    toast('Estimate added to your order ✔');
  };
}
const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

// ---------- Spin the wheel ----------
function initWheel() {
  const prizes = [
    { label: '5% OFF', code: 'CODE5', color: '#7d5f86' },
    { label: 'Try again', code: null, color: '#857e88' },
    { label: '10% OFF', code: 'CODE10', color: '#64789c' },
    { label: 'Free revision', code: 'FREEREV', color: '#4f7f74' },
    { label: '15% OFF', code: 'CODE15', color: '#ac6f52' },
    { label: 'Try again', code: null, color: '#857e88' },
    { label: 'Free title slide', code: 'FREEPPT', color: '#96586a' },
    { label: '10% OFF', code: 'CODE10', color: '#684c74' },
  ];
  const canvas = $('#wheel'), ctx = canvas.getContext('2d');
  const n = prizes.length, arc = (Math.PI * 2) / n, R = 150;
  prizes.forEach((p, i) => {
    ctx.beginPath(); ctx.moveTo(R, R);
    ctx.arc(R, R, R - 4, i * arc - Math.PI / 2, (i + 1) * arc - Math.PI / 2);
    ctx.fillStyle = p.color; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(R, R); ctx.rotate(i * arc + arc / 2 - Math.PI / 2);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(p.label, R - 18, 5); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(R, R, 22, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎓', R, R + 7);

  const btn = $('#spinBtn'), out = $('#prize');
  const showPrize = (p) => {
    if (p.code) {
      out.innerHTML = `You won <b>${p.label}</b>! Code: <code>${p.code}</code>`;
      $('#promoInput').value = p.code;
    } else out.textContent = 'So close! Try the Bug Hunt game below for another chance 🐞';
  };
  const saved = store.get('spinResult');
  if (saved !== null && prizes[saved]) {
    btn.disabled = true; btn.textContent = 'Already spun';
    showPrize(prizes[saved]);
  }
  let rotation = 0;
  btn.onclick = () => {
    btn.disabled = true;
    const idx = Math.floor(Math.random() * n);
    // Land the chosen slice under the pointer at the top
    const target = 360 - (idx * 360 / n + 180 / n);
    rotation += 360 * 6 + ((target - (rotation % 360)) + 360) % 360;
    canvas.style.transform = `rotate(${rotation}deg)`;
    setTimeout(() => {
      showPrize(prizes[idx]);
      store.set('spinResult', idx);
      btn.textContent = 'Already spun';
      if (prizes[idx].code) confetti();
    }, 4600);
  };
}

// ---------- Deadline panic meter ----------
function initPanic() {
  const input = $('#panicDate'), cd = $('#countdown'), fill = $('#panicFill'), msg = $('#panicMsg'), wa = $('#panicWa');
  let timer;
  const levels = [
    { h: 0, pct: 100, color: '#ff2d55', text: '💀 It\'s already past the deadline! Message me NOW.', shake: true },
    { h: 12, pct: 95, color: '#ff375f', text: '🔥 DEFCON 1. Drop everything and hit WhatsApp.', shake: true },
    { h: 24, pct: 85, color: '#ff5c7a', text: '😱 Less than a day! Panic is valid — but I can still help.', shake: true },
    { h: 72, pct: 65, color: '#ffb547', text: '😬 A few days left. Perfect time to get started.' },
    { h: 168, pct: 40, color: '#ffd166', text: '🙂 About a week. You\'re doing better than most!' },
    { h: Infinity, pct: 15, color: '#2ee59d', text: '😎 Plenty of time. You\'re a planning legend.' },
  ];
  function update() {
    const due = new Date(input.value);
    if (Number.isNaN(due.getTime())) return;
    const ms = due - Date.now();
    const h = ms / 36e5;
    const lvl = levels.find((l) => h <= l.h) || levels.at(-1);
    const s = Math.max(0, Math.floor(ms / 1000));
    cd.textContent = `${Math.floor(s / 86400)}d ${String(Math.floor(s / 3600) % 24).padStart(2, '0')}h ${String(Math.floor(s / 60) % 60).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
    fill.style.width = lvl.pct + '%';
    fill.style.background = lvl.color;
    msg.textContent = lvl.text;
    cd.classList.toggle('shake', !!lvl.shake);
    wa.style.display = h < 72 ? 'inline-flex' : 'none';
    wa.href = waLink(`URGENT 🚨 My assignment is due ${due.toLocaleString()}. Can you help?`);
  }
  input.addEventListener('input', () => {
    clearInterval(timer); update(); timer = setInterval(update, 1000);
    $('[name="deadline"]').value = input.value; // also prefill the order form
  });
}

// ---------- Jokes & quiz ----------
function initJokes() {
  const jokes = [
    'Why do programmers prefer dark mode? Because light attracts bugs. 🐛',
    'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?" 🍻',
    'There are 10 types of people: those who understand binary and those who don\'t.',
    'I would tell you a UDP joke, but you might not get it.',
    'Why did the developer go broke? Because he used up all his cache. 💸',
    '"It works on my machine." — Then we\'ll ship your machine. 📦',
    'Debugging: being the detective in a crime movie where you are also the murderer. 🕵️',
    'Why do Java developers wear glasses? Because they don\'t C#. 👓',
    'My code doesn\'t have bugs, it just develops random features. ✨',
    'An AI walks into a bar. The bartender asks "What\'ll it be?" The AI says "What is everyone else having?" 🤖',
    '!false — it\'s funny because it\'s true.',
    'Assignment deadline in 2 hours: "I work best under pressure." Narrator: they did not. ⏰',
  ];
  let last = 0;
  $('#jokeBtn').onclick = () => {
    let i; do { i = Math.floor(Math.random() * jokes.length); } while (i === last);
    last = i;
    const el = $('#joke');
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = jokes[i]; el.style.opacity = 1; }, 150);
  };
  $('#joke').style.transition = 'opacity .15s';

  const quiz = [
    { q: 'What is the time complexity of binary search?', a: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], c: 1 },
    { q: 'Which data structure uses LIFO?', a: ['Queue', 'Stack', 'Tree', 'Graph'], c: 1 },
    { q: 'What does SQL stand for?', a: ['Structured Query Language', 'Simple Question Logic', 'Server Queue List', 'System Query Loop'], c: 0 },
    { q: 'Which of these is a supervised learning algorithm?', a: ['K-Means', 'Linear Regression', 'PCA', 'Apriori'], c: 1 },
    { q: 'HTTP status code 404 means…', a: ['Server error', 'Unauthorized', 'Not Found', 'OK'], c: 2 },
    { q: 'Which OOP concept means "many forms"?', a: ['Encapsulation', 'Inheritance', 'Abstraction', 'Polymorphism'], c: 3 },
  ];
  let qi = Math.floor(Math.random() * quiz.length), score = 0, answered = 0;
  const box = $('#quiz');
  function render() {
    const item = quiz[qi % quiz.length];
    box.innerHTML = `<div class="quiz-q">${item.q}</div><div class="quiz-opts">${item.a.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>
      <p class="muted small" style="margin-top:8px">Score: ${score}/${answered}</p>`;
    $$('button', box).forEach((b) => (b.onclick = () => {
      const right = Number(b.dataset.i) === item.c;
      answered++; if (right) score++;
      $$('button', box).forEach((x) => { x.disabled = true; if (Number(x.dataset.i) === item.c) x.classList.add('right'); });
      if (!right) b.classList.add('wrong');
      toast(right ? 'Correct! 🧠' : 'Not quite — that\'s why I\'m here 😉');
      setTimeout(() => { qi++; render(); }, 1300);
    }));
  }
  render();
}

// ---------- Bug hunt ----------
function initBugHunt() {
  const arena = $('#bugArena'), startBtn = $('#bugStart'), scoreEl = $('#bugScore'), timeEl = $('#bugTime');
  let score, time, tick, spawner;
  function spawn() {
    const bug = document.createElement('button');
    bug.className = 'bug';
    bug.textContent = ['🐛', '🐞', '🪲', '🦟'][Math.floor(Math.random() * 4)];
    bug.setAttribute('aria-label', 'bug');
    bug.style.left = Math.random() * (arena.clientWidth - 40) + 'px';
    bug.style.top = Math.random() * (arena.clientHeight - 40) + 'px';
    bug.onclick = (e) => {
      e.stopPropagation();
      score++; scoreEl.textContent = score;
      const splat = document.createElement('span');
      splat.className = 'splat'; splat.textContent = '💥';
      splat.style.left = bug.style.left; splat.style.top = bug.style.top;
      arena.appendChild(splat); setTimeout(() => splat.remove(), 500);
      bug.remove();
      if (score >= 10) end(true);
    };
    arena.appendChild(bug);
    setTimeout(() => bug.remove(), 1400);
  }
  function end(win) {
    clearInterval(tick); clearInterval(spawner);
    $$('.bug', arena).forEach((b) => b.remove());
    startBtn.style.display = '';
    if (win) {
      startBtn.textContent = 'Play again';
      $('#promoInput').value = 'BUGHUNTER';
      arena.insertAdjacentHTML('afterbegin', '<p class="prize" style="position:absolute;top:12px">🏆 Bug-free! Code <code>BUGHUNTER</code> (20% off) added to your order.</p>');
      confetti();
    } else {
      startBtn.textContent = 'Try again';
      arena.insertAdjacentHTML('afterbegin', `<p class="prize" style="position:absolute;top:12px">⏰ Time's up! ${score}/10 — the bugs won this round.</p>`);
    }
  }
  startBtn.onclick = () => {
    $$('.prize', arena).forEach((p) => p.remove());
    score = 0; time = 15; scoreEl.textContent = 0; timeEl.textContent = 15;
    startBtn.style.display = 'none';
    spawner = setInterval(spawn, 550);
    tick = setInterval(() => { time--; timeEl.textContent = time; if (time <= 0) end(false); }, 1000);
  };
}

// ---------- Order form ----------
function initForm() {
  const form = $('#orderForm'), err = $('#formError'), btn = $('#submitBtn');
  const required = $$('[required]', form);
  const desc = $('[name="description"]', form);
  const deadline = $('[name="deadline"]', form);
  deadline.min = toLocalInput(new Date());

  // restore unsent draft
  try {
    const draft = JSON.parse(store.get('orderDraft') || '{}');
    Object.entries(draft).forEach(([k, v]) => { if (form.elements[k] && !form.elements[k].value) form.elements[k].value = v; });
  } catch { /* ignore */ }

  form.addEventListener('input', () => {
    const done = required.filter((el) => el.value.trim()).length;
    $('#formProgress').style.width = (done / required.length) * 100 + '%';
    $('#descCount').textContent = `${desc.value.length}/4000`;
    const data = Object.fromEntries(new FormData(form));
    delete data.website;
    store.set('orderDraft', JSON.stringify(data));
  });
  form.addEventListener('change', () => form.dispatchEvent(new Event('input')));
  form.dispatchEvent(new Event('input'));

  function validate() {
    let msg = '';
    required.forEach((el) => {
      const bad = !el.value.trim() || (el.name === 'whatsapp' && !/^[+0-9][0-9\s-]{9,20}$/.test(el.value.trim()))
        || (el.name === 'description' && el.value.trim().length < 10);
      el.classList.toggle('invalid', bad);
      if (bad && !msg) msg = el.name === 'whatsapp' ? 'Please enter a valid WhatsApp number (e.g. 03xx-xxxxxxx).'
        : el.name === 'description' ? 'Please describe your task in a bit more detail.' : 'Please fill in all required fields (*).';
    });
    const email = form.elements.email;
    if (email.value && !email.checkValidity()) { email.classList.add('invalid'); msg ||= 'Email looks invalid.'; }
    return msg;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = validate();
    if (err.textContent) { $('.invalid', form)?.focus(); return; }
    btn.disabled = true; btn.textContent = '⏳ Sending…';
    try {
      const data = Object.fromEntries(new FormData(form));
      data.deadline = new Date(data.deadline).toISOString();
      const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Something went wrong');
      showSuccess(out.id, data);
      form.reset();
      store.set('orderDraft', '{}');
      store.set('lastTrackingId', out.id);
      form.dispatchEvent(new Event('input'));
      loadStats();
    } catch (ex) {
      err.textContent = ex.message + ' You can also send your details on WhatsApp.';
    } finally {
      btn.disabled = false; btn.textContent = '🚀 Submit request';
    }
  });

  $('#sendViaWa').onclick = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const lines = [
      'Hi! I need help with an assignment 📚', '',
      d.name && `Name: ${d.name}`, d.university && `University: ${d.university}`,
      d.field && `Subject: ${d.field}`, d.service && `Service: ${d.service}`,
      d.title && `Task: ${d.title}`, d.description && `Details: ${d.description}`,
      d.deadline && `Deadline: ${new Date(d.deadline).toLocaleString()}`, d.budget && `Budget: ${d.budget}`,
      d.fileLink && `Files: ${d.fileLink}`, d.promo && `Promo: ${d.promo}`,
    ].filter((x) => x !== undefined && x !== '');
    open(waLink(lines.join('\n')), '_blank', 'noopener');
  };
}

function showSuccess(id, data) {
  $('#successId').textContent = id;
  $('#successWa').href = waLink(`Hi! I just submitted a request on your website.\nTracking ID: ${id}\nTask: ${data.title}`);
  $('#successModal').classList.add('open');
  confetti();
}
function initModal() {
  const modal = $('#successModal');
  $('#closeModal').onclick = () => modal.classList.remove('open');
  modal.addEventListener('click', (e) => e.target === modal && modal.classList.remove('open'));
  addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.remove('open'));
  $('#copyId').onclick = async () => {
    try { await navigator.clipboard.writeText($('#successId').textContent); toast('Tracking ID copied 📋'); }
    catch { toast('Copy failed — please write it down'); }
  };
}

// ---------- Tracking ----------
function initTrack() {
  const form = $('#trackForm'), input = $('#trackInput'), out = $('#trackResult');
  const last = store.get('lastTrackingId');
  if (last) input.value = last;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = input.value.trim().toUpperCase();
    out.innerHTML = '<p class="muted" style="text-align:center">Looking it up… 🔍</p>';
    try {
      const res = await fetch('/api/track/' + encodeURIComponent(id));
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      const flow = ['New', 'In Progress', 'Completed'];
      const pos = r.status === 'Cancelled' ? -1 : flow.indexOf(r.status);
      out.innerHTML = `
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
            <h3>Hi ${esc(r.name)} 👋</h3><span class="badge badge-${r.status.replace(' ', '-')}">${esc(r.status)}</span>
          </div>
          ${pos >= 0 ? `<div class="timeline"><div class="bar" style="width:${pos * 42}%"></div>
            ${['📥 Received', '⚙️ In progress', '✅ Completed'].map((l, i) => `<div class="tl-step ${i <= pos ? 'done' : ''}"><i>${i <= pos ? '✓' : i + 1}</i>${l}</div>`).join('')}
          </div>` : '<p style="margin-top:12px">This request was cancelled. Message me on WhatsApp if that\'s a mistake.</p>'}
          <dl class="kv">
            <dt>Tracking ID</dt><dd><b>${esc(r.id)}</b></dd>
            <dt>Task</dt><dd>${esc(r.title)}</dd>
            <dt>Service</dt><dd>${esc(r.service)}</dd>
            <dt>Deadline</dt><dd>${new Date(r.deadline).toLocaleString()}</dd>
            ${r.price ? `<dt>Quoted price</dt><dd>${fmtRs(r.price)}</dd>` : ''}
            ${r.client_note ? `<dt>Message from me</dt><dd>${esc(r.client_note)}</dd>` : ''}
            <dt>Last update</dt><dd>${new Date(r.updated_at).toLocaleString()}</dd>
          </dl>
          <a class="btn btn-wa btn-sm" style="margin-top:18px" target="_blank" rel="noopener" href="${waLink(`Hi! Checking on my request ${r.id}`)}">💬 Ask about this on WhatsApp</a>
        </div>`;
      if (r.status === 'Completed') confetti();
    } catch (ex) {
      out.innerHTML = `<p style="text-align:center;color:var(--danger);font-weight:600">${esc(ex.message || 'Could not find that ID.')}</p>`;
    }
  });
}

// ---------- Toast ----------
let toastTimer;
function toast(text) {
  const t = $('#toast');
  t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- Confetti ----------
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confetti'), ctx = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colors = ['#d9b8c0', '#c9bbe0', '#b7d6cb', '#f0d4b8', '#7d5f86', '#96586a'];
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight / 2.5,
    vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frames = 0;
  (function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach((p) => {
      p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (++frames < 170) requestAnimationFrame(draw); else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

// ---------- WhatsApp tooltip nudge ----------
function initWaNudge() {
  const fab = $('.wa-float');
  setTimeout(() => { fab.classList.add('tip'); setTimeout(() => fab.classList.remove('tip'), 4000); }, 6000);
}

// ---------- Boot ----------
$('#year').textContent = new Date().getFullYear();
initNav();
initServices();
initScrollFx();
initReveal();
initTyping();
initTerminal();
initEstimator();
initWheel();
initPanic();
initJokes();
initBugHunt();
initForm();
initModal();
initTrack();
initWaNudge();
loadConfig();
loadStats();
