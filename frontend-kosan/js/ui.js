/* ==========================================================================
   KasKos — helper UI bersama (ikon, toast, drawer mobile, modal a11y)
   Dimuat sebelum dashboard.js / dashboard-penghuni.js
   ========================================================================== */

// Ikon outline (gaya Lucide, viewBox 24x24). Dipakai lewat <i data-icon="nama"></i>
const ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'
};

function icon(name) {
    const paths = ICONS[name] || '';
    return `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">${paths}</svg></span>`;
}

// Ganti <i data-icon="..."> menjadi SVG
function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => {
        el.outerHTML = icon(el.getAttribute('data-icon'));
    });
}

// Escape teks sebelum disisipkan ke innerHTML
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Toast pengganti alert(). type: 'success' | 'error' | 'info'
function toast(message, type = 'info') {
    let host = document.getElementById('toastHost');
    if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        host.className = 'toast-host';
        host.setAttribute('aria-live', 'polite');
        document.body.appendChild(host);
    }

    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `${icon(iconName)}<div class="toast-msg"></div>
        <button type="button" class="toast-close" aria-label="Tutup notifikasi">${icon('x')}</button>`;
    el.querySelector('.toast-msg').textContent = message;

    const remove = () => el.remove();
    el.querySelector('.toast-close').addEventListener('click', remove);
    host.appendChild(el);
    setTimeout(remove, type === 'error' ? 7000 : 4500);
}

// Tebak jenis toast dari teks pesan lama (agar pemanggil alert() lama tidak perlu diubah satu-satu)
function notify(message) {
    const m = String(message || '');
    const isOk = /berhasil|sukses|dicatat|diterbitkan|dihapus|diperbarui/i.test(m);
    toast(m, isOk ? 'success' : /gagal|kesalahan|error|silakan/i.test(m) ? 'error' : 'info');
}

// Tombol dengan status loading (spinner + teks), kembalikan fungsi reset
function setLoading(btn, text) {
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.textContent = text;
    return () => {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.innerHTML = original;
        hydrateIcons(btn);
    };
}

// Navigasi: tandai menu aktif, tutup drawer mobile
function setActiveNav(activeBtn) {
    document.querySelectorAll('.menu-item').forEach(m => {
        m.classList.toggle('active', m === activeBtn);
        if (m === activeBtn) m.setAttribute('aria-current', 'page');
        else m.removeAttribute('aria-current');
    });
    closeSidebar();
    window.scrollTo({ top: 0 });
}

function openSidebar() {
    const sb = document.querySelector('.sidebar');
    if (!sb) return;
    sb.classList.add('open');
    document.getElementById('scrim')?.classList.add('show');
    document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'true');
    sb.querySelector('.menu-item.active, .menu-item')?.focus();
}

function closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.getElementById('scrim')?.classList.remove('show');
    document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'false');
}

document.addEventListener('DOMContentLoaded', () => {
    hydrateIcons();

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', e => setActiveNav(e.currentTarget));
    });
    const activeNow = document.querySelector('.menu-item.active');
    if (activeNow) activeNow.setAttribute('aria-current', 'page');

    document.getElementById('menuToggle')?.addEventListener('click', openSidebar);
    document.getElementById('scrim')?.addEventListener('click', closeSidebar);
});

// Escape menutup modal / drawer
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('modalBukti');
    if (modal && modal.classList.contains('active') && typeof closeModalBukti === 'function') {
        closeModalBukti();
        return;
    }
    closeSidebar();
});
