const btn = document.getElementById('adminBtn');
const getToken = () => localStorage.getItem('adminToken');
const setBtn = () => { btn.textContent = getToken() ? '⚙ Admin' : '🔐 Login'; };
setBtn();

const esc = (s = '') =>
    String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const modal = document.createElement('div');
modal.id = 'adminModal';
document.body.appendChild(modal);

// keep typing in the admin box from moving the ship
['keydown', 'keyup'].forEach((ev) => modal.addEventListener(ev, (e) => e.stopPropagation()));
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

const v = (sel) => modal.querySelector(sel).value.trim();

function closeModal() { modal.style.display = 'none'; }

function box(html) {
    modal.innerHTML = `<div class="box"><button class="close" id="aClose">✕</button>${html}</div>`;
    modal.querySelector('#aClose').onclick = closeModal;
}

async function api(path, opts = {}) {
    const res = await fetch(path, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + getToken(),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        localStorage.removeItem('adminToken');
        setBtn();
        showLogin(data.error || 'Please login again');
        throw new Error('auth');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ---------- Login ----------
function showLogin(msg = '') {
    box(`
    <h2>Admin login</h2>
    <form id="lf">
      <input id="lu" placeholder="Username" autocomplete="username">
      <input id="lp" type="password" placeholder="Password" autocomplete="current-password" style="margin-top:8px">
      <button type="submit">Login</button>
      <div class="st" id="ls">${esc(msg)}</div>
    </form>`);
    modal.querySelector('#lf').onsubmit = async (e) => {
        e.preventDefault();
        const st = modal.querySelector('#ls');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: v('#lu'), password: modal.querySelector('#lp').value }),
            });
            const data = await res.json();
            if (!res.ok) { st.textContent = data.error; return; }
            localStorage.setItem('adminToken', data.token);
            setBtn();
            showEditor();
        } catch {
            st.textContent = 'Network error';
        }
    };
}

// ---------- Island editor ----------
async function showEditor(idx = 0) {
    box('<p>Loading...</p>');
    try {
        const islands = await (await fetch('/api/islands')).json();
        const d = islands[idx];
        if (!d) { box('<h2>Admin</h2><p>No islands found. Run node seed.js once.</p>'); return; }

        box(`
      <h2>Edit portfolio</h2>
      <div class="tabs">
        ${islands.map((i, n) => `<button data-i="${n}" class="${n === idx ? 'on' : ''}">${esc(i.name)}</button>`).join('')}
        <button id="tMsg">📬 Messages</button>
        <button id="tOut">Logout</button>
      </div>
      <label>Island name (floating label)</label>
      <input id="fName" value="${esc(d.name)}">
      <label>Panel title</label>
      <input id="fTitle" value="${esc(d.title)}">
      <label>Text lines (one per line)</label>
      <textarea id="fLines" rows="6">${esc((d.lines || []).join('\n'))}</textarea>
      <label>Links (one per line, format: Label | https://url)</label>
      <textarea id="fLinks" rows="3">${esc((d.links || []).map((l) => `${l.label} | ${l.url}`).join('\n'))}</textarea>
      <label>Position X</label>
      <input id="fX" type="number" value="${d.x}">
      <label>Position Z</label>
      <input id="fZ" type="number" value="${d.z}">
      <button class="save" id="fSave">Save changes</button>
      <div class="st" id="fSt"></div>`);

        modal.querySelectorAll('.tabs [data-i]').forEach((b) => {
            b.onclick = () => showEditor(Number(b.dataset.i));
        });
        modal.querySelector('#tMsg').onclick = showMessages;
        modal.querySelector('#tOut').onclick = () => {
            localStorage.removeItem('adminToken');
            setBtn();
            closeModal();
        };

        modal.querySelector('#fSave').onclick = async () => {
            const st = modal.querySelector('#fSt');
            const body = {
                name: v('#fName'),
                title: v('#fTitle'),
                lines: v('#fLines').split('\n').map((s) => s.trim()).filter(Boolean),
                links: v('#fLinks').split('\n').map((s) => s.trim()).filter(Boolean).map((l) => {
                    const [label, ...rest] = l.split('|');
                    return { label: label.trim(), url: rest.join('|').trim() };
                }).filter((l) => l.label && l.url),
                x: Number(v('#fX')),
                z: Number(v('#fZ')),
            };
            try {
                await api('/api/islands/' + d._id, { method: 'PUT', body: JSON.stringify(body) });
                st.textContent = 'Saved! Reloading...';
                setTimeout(() => location.reload(), 700);
            } catch (e) {
                if (e.message !== 'auth') st.textContent = e.message;
            }
        };
    } catch (e) {
        if (e.message !== 'auth') box(`<h2>Admin</h2><p>${esc(e.message)}</p>`);
    }
}

// ---------- Messages ----------
async function showMessages() {
    box('<p>Loading...</p>');
    try {
        const msgs = await api('/api/contact');
        box(`
      <h2>Messages</h2>
      <div class="tabs"><button id="tBack">← Back to editor</button></div>
      <div id="mList"></div>`);
        modal.querySelector('#tBack').onclick = () => showEditor();
        const list = modal.querySelector('#mList');
        if (!msgs.length) list.textContent = 'No messages yet.';
        msgs.forEach((m) => {
            const div = document.createElement('div');
            div.className = 'msg';
            const who = document.createElement('b');
            who.textContent = `${m.name} (${m.email})`;
            const when = document.createElement('small');
            when.textContent = ' ' + new Date(m.createdAt).toLocaleString();
            const text = document.createElement('p');
            text.textContent = m.message;
            div.append(who, when, text);
            list.appendChild(div);
        });
    } catch (e) {
        if (e.message !== 'auth') box(`<h2>Messages</h2><p>${esc(e.message)}</p>`);
    }
}

// ---------- Open ----------
btn.onclick = () => {
    modal.style.display = 'flex';
    getToken() ? showEditor() : showLogin();
};