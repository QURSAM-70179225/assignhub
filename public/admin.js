// ===== AssignHub — admin dashboard =====
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* blocked */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* blocked */ } },
};
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* blocked */ } },
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtRs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');
const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

let token = ss.get('adminToken');
let requests = [];
let statuses = ['New', 'In Progress', 'Completed', 'Cancelled'];
let filter = 'All';
let knownIds = null;
let seen = new Set(JSON.parse(ls.get('seenIds') || '[]'));
let pollTimer;

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(opts.headers || {}) },
  });
  if (res.status === 401) { logout(true); throw new Error('Session expired — please log in again.'); }
  return res;
}

// ---------- Auth ----------
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#loginError');
  err.textContent = '';
  try {
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#password').value }) });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error);
    token = out.token;
    ss.set('adminToken', token);
    $('#password').value = '';
    showDash();
  } catch (ex) {
    err.textContent = ex.message || 'Login failed';
    $('#loginForm').classList.add('shake');
    setTimeout(() => $('#loginForm').classList.remove('shake'), 400);
  }
});

function logout(expired) {
  if (!expired && token) fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
  token = null; ss.del('adminToken');
  clearInterval(pollTimer);
  $('#dashView').hidden = true; $('#loginView').hidden = false;
  closeDrawer();
}
$('#logoutBtn').onclick = () => logout(false);

function showDash() {
  $('#loginView').hidden = true; $('#dashView').hidden = false;
  load();
  clearInterval(pollTimer);
  pollTimer = setInterval(load, 30000);
}

// ---------- Data ----------
async function load() {
  try {
    const out = await (await api('/api/admin/requests')).json();
    requests = out.requests; statuses = out.statuses;
    const ids = new Set(requests.map((r) => r.id));
    if (knownIds) {
      const fresh = requests.filter((r) => !knownIds.has(r.id));
      if (fresh.length) { toast(`🔔 ${fresh.length} new request${fresh.length > 1 ? 's' : ''}! ${fresh[0].name} — ${fresh[0].service}`); beep(); }
    }
    knownIds = ids;
    $('#lastSync').textContent = 'Synced ' + new Date().toLocaleTimeString();
    render();
  } catch (ex) { toast(ex.message); }
}

function render() {
  // KPIs
  const count = (s) => requests.filter((r) => r.status === s).length;
  const revenue = requests.filter((r) => r.status === 'Completed' && r.price).reduce((a, r) => a + r.price, 0);
  const pipeline = requests.filter((r) => ['New', 'In Progress'].includes(r.status) && r.price).reduce((a, r) => a + r.price, 0);
  $('#kpis').innerHTML = [
    ['📥 Total requests', requests.length],
    ['🆕 New', count('New')],
    ['⚙️ In progress', count('In Progress')],
    ['✅ Completed', count('Completed')],
    ['💰 Earned / pipeline', `${fmtRs(revenue)} <small class="muted" style="font-size:.9rem">+ ${fmtRs(pipeline)}</small>`],
  ].map(([l, v]) => `<div class="kpi"><span>${l}</span><b>${v}</b></div>`).join('');

  // Chips
  $('#statusChips').innerHTML = ['All', ...statuses].map((s) =>
    `<button class="chip ${s === filter ? 'active' : ''}" data-s="${s}">${s}<i>${s === 'All' ? requests.length : count(s)}</i></button>`).join('');
  $$('.chip').forEach((c) => (c.onclick = () => { filter = c.dataset.s; render(); }));

  // List
  const q = $('#search').value.trim().toLowerCase();
  let list = requests.filter((r) => (filter === 'All' || r.status === filter) &&
    (!q || [r.id, r.name, r.title, r.field, r.service, r.whatsapp, r.university, r.email].join(' ').toLowerCase().includes(q)));
  const sort = $('#sortBy').value;
  if (sort === 'old') list = list.slice().reverse();
  if (sort === 'deadline') list = list.slice().sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const unseenCount = requests.filter((r) => !seen.has(r.id)).length;
  document.title = (unseenCount ? `(${unseenCount}) ` : '') + 'Admin — AssignHub';

  $('#reqList').innerHTML = list.length ? list.map((r) => {
    const hrs = (new Date(r.deadline) - Date.now()) / 36e5;
    const active = ['New', 'In Progress'].includes(r.status);
    const dueCls = active && hrs < 0 ? 'late' : active && hrs < 48 ? 'soon' : '';
    return `<article class="req ${seen.has(r.id) ? '' : 'unseen'}" data-id="${esc(r.id)}" tabindex="0">
      <div>
        <h3>${esc(r.title)}</h3>
        <div class="req-meta">
          <span>👤 ${esc(r.name)}</span><span>🧩 ${esc(r.service)}</span><span>📚 ${esc(r.field)}</span>
          ${r.university ? `<span>🏫 ${esc(r.university)}</span>` : ''}<span class="mono">#${esc(r.id)}</span>
        </div>
      </div>
      <div class="req-right">
        <span class="badge badge-${r.status.replace(' ', '-')}">${esc(r.status)}</span>
        <span class="due ${dueCls}">⏰ ${dueLabel(hrs)}</span>
        ${r.price ? `<span class="small">${fmtRs(r.price)}</span>` : r.estimate ? `<span class="small muted">est. ${esc(r.estimate)}</span>` : ''}
      </div>
    </article>`;
  }).join('') : `<div class="empty"><div>📭</div><p>${requests.length ? 'No requests match your filters.' : 'No requests yet. Share your website link to get your first order!'}</p></div>`;

  $$('.req').forEach((el) => {
    el.onclick = () => openDrawer(el.dataset.id);
    el.onkeydown = (e) => e.key === 'Enter' && openDrawer(el.dataset.id);
  });
}

function dueLabel(hrs) {
  if (hrs < 0) return `overdue by ${fmtSpan(-hrs)}`;
  return `due in ${fmtSpan(hrs)}`;
}
const fmtSpan = (h) => (h < 1 ? Math.round(h * 60) + 'm' : h < 48 ? Math.round(h) + 'h' : Math.round(h / 24) + 'd');

$('#search').addEventListener('input', render);
$('#sortBy').addEventListener('change', render);
$('#refreshBtn').onclick = load;

// ---------- WhatsApp helpers ----------
function waNumber(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '92' + d.slice(1); // Pakistani local format → international
  return d;
}
const waTo = (r, text) => `https://wa.me/${waNumber(r.whatsapp)}?text=${encodeURIComponent(text)}`;
const templates = (r) => ({
  'Quote': `Hi ${r.name.split(' ')[0]}! 👋 I've reviewed your request "${r.title}" (${r.id}).${r.price ? ` The price would be ${fmtRs(r.price)}.` : ''} I can deliver before your deadline (${fmtDate(r.deadline)}). Shall we start?`,
  'Need details': `Hi ${r.name.split(' ')[0]}! About your request "${r.title}" (${r.id}) — could you share a few more details or the assignment file?`,
  'Started': `Hi ${r.name.split(' ')[0]}! Good news — I've started working on "${r.title}" (${r.id}). You can track it on the website with your ID. 🚀`,
  'Delivered': `Hi ${r.name.split(' ')[0]}! 🎉 Your work for "${r.title}" (${r.id}) is complete. Sending it now — let me know if you need any changes!`,
});

// ---------- Drawer ----------
function openDrawer(id) {
  const r = requests.find((x) => x.id === id);
  if (!r) return;
  seen.add(id); ls.set('seenIds', JSON.stringify([...seen].slice(-1000)));
  render();
  const t = templates(r);
  $('#drawerPanel').innerHTML = `
    <div class="drawer-head">
      <div><span class="muted small mono">#${esc(r.id)} · ${fmtDate(r.created_at)}</span><h2 style="font-size:1.4rem">${esc(r.title)}</h2></div>
      <button class="icon-btn" id="closeDrawer" aria-label="Close">✕</button>
    </div>
    <div class="drawer-actions">
      <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waTo(r, t['Quote'])}">💬 WhatsApp ${esc(r.name.split(' ')[0])}</a>
      ${r.email ? `<a class="btn btn-ghost btn-sm" href="mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent('Your request ' + r.id)}">✉️ Email</a>` : ''}
      <button class="btn btn-ghost btn-sm" id="copyDetails">📋 Copy details</button>
    </div>
    <div>
      <span class="muted small">Quick WhatsApp replies</span>
      <div class="quick">${Object.entries(t).map(([k, v]) => `<a class="btn btn-ghost" style="font-size:.78rem;padding:6px 12px" target="_blank" rel="noopener" href="${waTo(r, v)}">${k}</a>`).join('')}</div>
    </div>
    <dl class="kv">
      <dt>Name</dt><dd>${esc(r.name)}</dd>
      <dt>WhatsApp</dt><dd>${esc(r.whatsapp)}</dd>
      ${r.email ? `<dt>Email</dt><dd>${esc(r.email)}</dd>` : ''}
      ${r.university ? `<dt>University</dt><dd>${esc(r.university)}</dd>` : ''}
      <dt>Subject</dt><dd>${esc(r.field)}</dd>
      <dt>Service</dt><dd>${esc(r.service)}</dd>
      <dt>Deadline</dt><dd>${fmtDate(r.deadline)} (${dueLabel((new Date(r.deadline) - Date.now()) / 36e5)})</dd>
      ${r.budget ? `<dt>Budget</dt><dd>${esc(r.budget)}</dd>` : ''}
      ${r.estimate ? `<dt>Site estimate</dt><dd>${esc(r.estimate)}</dd>` : ''}
      ${r.promo ? `<dt>Promo code</dt><dd><span class="badge badge-New">${esc(r.promo)}</span></dd>` : ''}
      ${r.file_link ? `<dt>Files</dt><dd><a href="${esc(r.file_link)}" target="_blank" rel="noopener noreferrer">${esc(r.file_link)}</a></dd>` : ''}
    </dl>
    <div><span class="muted small">Description</span><div class="desc-box">${esc(r.description)}</div></div>
    <form id="editForm" style="display:grid;gap:14px">
      <div class="grid-2">
        <label>Status<select name="status">${statuses.map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label>Agreed price (Rs)<input name="price" type="number" min="0" step="100" value="${r.price ?? ''}" placeholder="e.g. 3000"></label>
      </div>
      <label>Message to client <span class="muted small">(shown on their tracking page)</span>
        <textarea name="clientNote" rows="2" maxlength="1000" placeholder="e.g. Half done, delivering tomorrow evening!">${esc(r.client_note)}</textarea></label>
      <label>Private notes <span class="muted small">(only you see this)</span>
        <textarea name="adminNotes" rows="3" maxlength="4000" placeholder="Payment received via JazzCash…">${esc(r.admin_notes)}</textarea></label>
      <div class="drawer-actions">
        <button class="btn btn-primary">💾 Save changes</button>
        <button type="button" class="btn btn-danger btn-sm" id="deleteBtn">🗑 Delete</button>
      </div>
    </form>`;
  $('#drawer').classList.add('open');
  $('#closeDrawer').onclick = closeDrawer;
  $('#copyDetails').onclick = async () => {
    const text = `${r.id}\n${r.title}\n${r.name} — ${r.whatsapp}\n${r.service} / ${r.field}\nDeadline: ${fmtDate(r.deadline)}\n\n${r.description}`;
    try { await navigator.clipboard.writeText(text); toast('Copied 📋'); } catch { toast('Copy failed'); }
  };
  $('#editForm').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      const res = await api('/api/admin/requests/' + encodeURIComponent(r.id), { method: 'PATCH', body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      requests = requests.map((x) => (x.id === updated.id ? updated : x));
      render(); toast('Saved ✔'); openDrawer(updated.id);
    } catch (ex) { toast(ex.message); }
  };
  $('#deleteBtn').onclick = async () => {
    if (!confirm(`Delete request ${r.id} from ${r.name}? This cannot be undone.`)) return;
    try {
      const res = await api('/api/admin/requests/' + encodeURIComponent(r.id), { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      requests = requests.filter((x) => x.id !== r.id);
      closeDrawer(); render(); toast('Deleted');
    } catch (ex) { toast(ex.message); }
  };
}
function closeDrawer() { $('#drawer').classList.remove('open'); }
$('#drawer').addEventListener('click', (e) => e.target.id === 'drawer' && closeDrawer());
addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());

// ---------- Export ----------
$('#exportBtn').onclick = async () => {
  try {
    const res = await api('/api/admin/export.csv');
    const blob = await res.blob();
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `assignhub-requests-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  } catch (ex) { toast(ex.message); }
};

// ---------- Theme / toast / beep ----------
(function initTheme() {
  const btn = $('#themeToggle');
  const apply = (t) => { document.documentElement.dataset.theme = t; btn.textContent = t === 'light' ? '🌙' : '☀️'; };
  apply(ls.get('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  btn.onclick = () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; apply(t); ls.set('theme', t); };
})();
let toastTimer;
function toast(text) {
  const t = $('#toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
function beep() {
  try {
    const ctx = new AudioContext(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .4);
    o.start(); o.stop(ctx.currentTime + .4);
  } catch { /* audio blocked */ }
}

if (token) showDash();
