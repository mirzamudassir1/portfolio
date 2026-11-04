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

const v = (sel) => {
    const el = modal.querySelector(sel);
    return el ? el.value.trim() : '';
};

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

// Helper to initialize projects if not present
function parseProjectsFromIsland(d) {
    if (Array.isArray(d.projects) && d.projects.length > 0) {
        return JSON.parse(JSON.stringify(d.projects));
    }
    const lines = d.lines || [];
    const links = d.links || [];
    return lines.map((line, idx) => {
        const parts = line.split('-').map((s) => s.trim());
        const title = parts[0] || `Project ${idx + 1}`;
        const desc = parts.slice(1).join(' - ') || '';
        const matchingLink = links[idx] || {};
        return {
            title,
            description: desc,
            tech: ['JavaScript'],
            github: matchingLink.url || '',
            demo: '',
        };
    });
}

// ---------- Island editor ----------
async function showEditor(idx = 0) {
    box('<p>Loading...</p>');
    try {
        const islands = await (await fetch('/api/islands')).json();
        const d = islands[idx];
        if (!d) { box('<h2>Admin</h2><p>No islands found. Run node seed.js once.</p>'); return; }

        const isProjects = d.type === 'projects' || d.name.toLowerCase() === 'projects';
        let projectList = isProjects ? parseProjectsFromIsland(d) : [];

        function renderProjectsHTML() {
            if (!isProjects) return '';
            return `
        <div class="pm-container">
          <div class="pm-header">
            <h3>🚀 Projects Showcase Manager (${projectList.length})</h3>
            <button type="button" id="pmAddBtn" class="pm-add-btn">+ Add New Project</button>
          </div>
          <div id="pmList">
            ${projectList.map((p, pIdx) => `
              <div class="pm-card" data-idx="${pIdx}">
                <button type="button" class="pm-del-btn" data-del="${pIdx}">✕ Remove</button>
                <label>Project Title</label>
                <input class="pm-title" value="${esc(p.title)}" placeholder="e.g. QuizPro - Exam App">
                <label>Description</label>
                <textarea class="pm-desc" rows="2" placeholder="Brief summary of features...">${esc(p.description || '')}</textarea>
                <label>Tech Stack (comma separated)</label>
                <input class="pm-tech" value="${esc(Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || ''))}" placeholder="React, Node.js, Express, MongoDB">
                <div style="display:flex;gap:8px;">
                  <div style="flex:1;">
                    <label>GitHub URL</label>
                    <input class="pm-github" value="${esc(p.github || '')}" placeholder="https://github.com/...">
                  </div>
                  <div style="flex:1;">
                    <label>Live Demo URL</label>
                    <input class="pm-demo" value="${esc(p.demo || '')}" placeholder="https://...">
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
        }

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

      ${renderProjectsHTML()}

      <label>Text lines (one per line)</label>
      <textarea id="fLines" rows="5">${esc((d.lines || []).join('\n'))}</textarea>
      <label>Links (one per line, format: Label | https://url)</label>
      <textarea id="fLinks" rows="3">${esc((d.links || []).map((l) => `${l.label} | ${l.url}`).join('\n'))}</textarea>
      
      <div style="display:flex;gap:12px;">
        <div style="flex:1;">
          <label>Position X</label>
          <input id="fX" type="number" value="${d.x}">
        </div>
        <div style="flex:1;">
          <label>Position Z</label>
          <input id="fZ" type="number" value="${d.z}">
        </div>
      </div>

      <button class="save" id="fSave">Save changes</button>
      <div class="st" id="fSt"></div>
    `);

        // Bind tabs
        modal.querySelectorAll('.tabs [data-i]').forEach((b) => {
            b.onclick = () => showEditor(Number(b.dataset.i));
        });
        modal.querySelector('#tMsg').onclick = showMessages;
        modal.querySelector('#tOut').onclick = () => {
            localStorage.removeItem('adminToken');
            setBtn();
            closeModal();
        };

        // Bind projects manager events
        if (isProjects) {
            const syncDOMToProjects = () => {
                const cards = modal.querySelectorAll('.pm-card');
                projectList = Array.from(cards).map((c) => ({
                    title: c.querySelector('.pm-title').value.trim(),
                    description: c.querySelector('.pm-desc').value.trim(),
                    tech: c.querySelector('.pm-tech').value.split(',').map((s) => s.trim()).filter(Boolean),
                    github: c.querySelector('.pm-github').value.trim(),
                    demo: c.querySelector('.pm-demo').value.trim(),
                }));
            };

            const refreshProjectsUI = () => {
                syncDOMToProjects();
                const container = modal.querySelector('.pm-container');
                if (container) {
                    const temp = document.createElement('div');
                    temp.innerHTML = renderProjectsHTML();
                    container.replaceWith(temp.firstElementChild);
                    bindProjectEvents();
                }
            };

            const bindProjectEvents = () => {
                const addBtn = modal.querySelector('#pmAddBtn');
                if (addBtn) {
                    addBtn.onclick = () => {
                        syncDOMToProjects();
                        projectList.push({
                            title: 'New Project',
                            description: 'Description of the new project...',
                            tech: ['React', 'Node.js'],
                            github: '',
                            demo: '',
                        });
                        refreshProjectsUI();
                    };
                }
                modal.querySelectorAll('[data-del]').forEach((delBtn) => {
                    delBtn.onclick = (e) => {
                        syncDOMToProjects();
                        const pIdx = Number(e.currentTarget.dataset.del);
                        projectList.splice(pIdx, 1);
                        refreshProjectsUI();
                    };
                });
            };

            bindProjectEvents();
        }

        modal.querySelector('#fSave').onclick = async () => {
            const st = modal.querySelector('#fSt');
            st.textContent = 'Saving...';

            let savedProjects = [];
            if (isProjects) {
                const cards = modal.querySelectorAll('.pm-card');
                savedProjects = Array.from(cards).map((c) => ({
                    title: c.querySelector('.pm-title').value.trim(),
                    description: c.querySelector('.pm-desc').value.trim(),
                    tech: c.querySelector('.pm-tech').value.split(',').map((s) => s.trim()).filter(Boolean),
                    github: c.querySelector('.pm-github').value.trim(),
                    demo: c.querySelector('.pm-demo').value.trim(),
                })).filter((p) => p.title);
            }

            // Sync lines & links
            let lines = v('#fLines').split('\n').map((s) => s.trim()).filter(Boolean);
            if (isProjects && savedProjects.length > 0 && (!lines || lines.length === 0)) {
                lines = savedProjects.map((p) => p.description ? `${p.title} - ${p.description}` : p.title);
            }

            let links = v('#fLinks').split('\n').map((s) => s.trim()).filter(Boolean).map((l) => {
                const [label, ...rest] = l.split('|');
                return { label: label.trim(), url: rest.join('|').trim() };
            }).filter((l) => l.label && l.url);

            const body = {
                name: v('#fName'),
                title: v('#fTitle'),
                lines,
                links,
                projects: savedProjects,
                x: Number(v('#fX')),
                z: Number(v('#fZ')),
            };

            try {
                const targetId = d._id || ('island_' + d.type);
                await api('/api/islands/' + targetId, { method: 'PUT', body: JSON.stringify(body) });
                st.textContent = 'Saved successfully! Updating view...';
                setTimeout(() => location.reload(), 600);
            } catch (e) {
                if (e.message !== 'auth') st.textContent = 'Error: ' + e.message;
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
