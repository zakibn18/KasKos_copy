const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://kas-kos-copy.vercel.app/api';
  
let token = localStorage.getItem('token');
let currentUser = null;
let tagihanDataList = [];
let penghuniProfilCache = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthPenghuni();
    setupNavigation();
    loadDashboardPenghuni();
    loadProfil();
    setupImagePreview();
    setupUploadForm();
    setupEditProfilListener();
});

// 1. Verifikasi Autentikasi Penghuni
function checkAuthPenghuni() {
    const userStr = localStorage.getItem('userKos');
    token = localStorage.getItem('token');

    if (!userStr || !token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        currentUser = JSON.parse(userStr);
    } catch (e) {
        window.location.href = 'index.html';
        return;
    }

    const role = (currentUser.role || '').toLowerCase();
    if (['pengelola', 'pemilik', 'admin'].includes(role)) {
        window.location.href = 'dashboard-pengelola.html';
        return;
    }

    document.getElementById('welcomeMessage').textContent = `Halo, ${currentUser.nama_lengkap || 'Penghuni'}`;
}

function logout() {
    if (confirm('Yakin ingin keluar dari akun?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userKos');
        window.location.href = 'index.html';
    }
}

// 2. Setup Navigasi SPA
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            menuItems.forEach(m => m.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');

            if (targetId === 'page-dashboard') loadDashboardPenghuni();
            if (targetId === 'page-tagihan') loadTagihanPenghuni();
            if (targetId === 'page-upload') populateSelectTagihan();
            if (targetId === 'page-riwayat') loadRiwayatPembayaran();
            if (targetId === 'page-profil') loadProfil();
        });
    });
}

// 3. Muat Data Tagihan & Dashboard Utama
async function loadDashboardPenghuni() {
    try {
        const res = await fetch(`${API_URL}/tagihan`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            logout();
            return;
        }

        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        tagihanDataList = data;

        // Banner Pengingat Jatuh Tempo
        const reminderContainer = document.getElementById('reminder-banner');
        reminderContainer.innerHTML = '';
        const reminders = data.filter(t => t.reminder);

        if (reminders.length > 0) {
            reminders.forEach(t => {
                const isOverdue = t.isOverdue;
                const bannerClass = isOverdue ? 'alert-danger' : 'alert-warning';
                const bannerIcon = isOverdue ? 'alert-circle' : 'clock';
                reminderContainer.innerHTML += `
                    <div class="alert-banner ${bannerClass}" role="alert">
                        ${icon(bannerIcon)}
                        <div>
                            <strong>Peringatan Tagihan Periode ${t.bulan_tagihan}/${t.tahun_tagihan}:</strong> ${t.reminder}
                        </div>
                    </div>
                `;
            });
        }

        // Tampilkan Ringkasan di Card Dashboard
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const tagihanBulanIni = data.find(t => t.bulan_tagihan === currentMonth && t.tahun_tagihan === currentYear) || data[0];

        if (tagihanBulanIni) {
            document.getElementById('stat-total-tagihan').textContent = `Rp ${Number(tagihanBulanIni.total_tagihan).toLocaleString('id-ID')}`;
            document.getElementById('stat-jatuh-tempo').textContent = tagihanBulanIni.tanggal_jatuh_tempo || '-';
            
            const badgeEl = document.getElementById('stat-status');
            const status = tagihanBulanIni.status_tagihan;
            badgeEl.className = 'badge ' + getBadgeClass(status);
            badgeEl.textContent = formatStatus(status);

            const kamarNomor = tagihanBulanIni.penghuni?.kamar?.nomor_kamar || '-';
            document.getElementById('stat-kamar').textContent = `Kamar ${kamarNomor}`;
            document.getElementById('kamarInfo').textContent = `Kamar: No. ${kamarNomor} | Status Akun: Aktif`;
        } else {
            document.getElementById('stat-total-tagihan').textContent = 'Rp 0';
            document.getElementById('stat-jatuh-tempo').textContent = '-';
            document.getElementById('stat-status').textContent = 'Tidak ada tagihan aktif';
        }

        // Sekaligus render tabel tagihan dan dropdown upload
        renderTableTagihan(data);
        populateSelectTagihan();

    } catch (err) {
        console.error('Gagal memuat dashboard penghuni:', err);
    }
}

function loadTagihanPenghuni() {
    loadDashboardPenghuni();
}

function renderTableTagihan(data) {
    const tbody = document.getElementById('tbody-tagihan');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Belum ada data tagihan kos yang diterbitkan.</td></tr>`;
        return;
    }

    data.forEach(t => {
        const status = t.status_tagihan;
        const nomorKamar = t.penghuni?.kamar?.nomor_kamar || '-';
        const canUpload = status !== 'lunas';

        tbody.innerHTML += `
            <tr>
                <td><strong>${t.bulan_tagihan}/${t.tahun_tagihan}</strong></td>
                <td>Kamar ${nomorKamar}</td>
                <td>Rp ${Number(t.nominal_dasar).toLocaleString('id-ID')}</td>
                <td>Rp ${Number(t.nominal_denda || 0).toLocaleString('id-ID')}</td>
                <td><strong class="cell-strong">Rp ${Number(t.total_tagihan).toLocaleString('id-ID')}</strong></td>
                <td>${t.tanggal_jatuh_tempo || '-'}</td>
                <td><span class="badge ${getBadgeClass(status)}">${formatStatus(status)}</span></td>
                <td>
                    ${canUpload
                        ? `<button type="button" class="btn-primary btn-sm" onclick="goToUpload('${t.id}')">Unggah Bukti</button>`
                        : `<span class="badge badge-lunas">Lunas</span>`
                    }
                </td>
            </tr>
        `;
    });
}

function goToUpload(tagihanId) {
    const uploadMenu = document.querySelector('.menu-item[data-target="page-upload"]');
    setActiveNav(uploadMenu);

    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('page-upload').classList.add('active');

    populateSelectTagihan();
    const select = document.getElementById('select-tagihan-bayar');
    if (select) select.value = tagihanId;
}

function populateSelectTagihan() {
    const select = document.getElementById('select-tagihan-bayar');
    if (!select) return;

    select.innerHTML = '<option value="">-- Pilih Tagihan yang Akan Dibayar --</option>';
    const unpaid = tagihanDataList.filter(t => t.status_tagihan !== 'lunas');

    if (unpaid.length === 0) {
        select.innerHTML = '<option value="">Semua tagihan Anda telah lunas!</option>';
        return;
    }

    unpaid.forEach(t => {
        select.innerHTML += `
            <option value="${t.id}">
                Periode ${t.bulan_tagihan}/${t.tahun_tagihan} - Total: Rp ${Number(t.total_tagihan).toLocaleString('id-ID')} (${formatStatus(t.status_tagihan)})
            </option>
        `;
    });
}

// 4. Setup Upload Foto & Form Handler
function setupImagePreview() {
    const input = document.getElementById('input-file-bukti');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');

    if (input) {
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = 'none';
            }
        });
    }
}

function setupUploadForm() {
    const form = document.getElementById('uploadBuktiForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tagihanId = document.getElementById('select-tagihan-bayar').value;
        const fileInput = document.getElementById('input-file-bukti');
        const btn = document.getElementById('btn-upload-ocr');
        const resultCard = document.getElementById('ocr-result-card');
        const resultTitle = document.getElementById('ocr-result-title');
        const resultBody = document.getElementById('ocr-result-body');

        if (!tagihanId) {
            notify('Silakan pilih tagihan yang akan dibayar terlebih dahulu.');
            return;
        }

        if (!fileInput.files || !fileInput.files[0]) {
            notify('Silakan pilih file foto bukti transfer.');
            return;
        }

        const formData = new FormData();
        formData.append('tagihan_id', tagihanId);
        formData.append('bukti', fileInput.files[0]);

        const resetBtn = setLoading(btn, 'Memindai & memverifikasi...');
        resultCard.style.display = 'none';

        try {
            const res = await fetch(`${API_URL}/pembayaran/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const result = await res.json();

            if (res.ok) {
                resultCard.style.display = 'block';
                const isAuto = result.is_valid_otomatis;

                resultTitle.innerHTML = isAuto
                    ? icon('check-circle') + 'Verifikasi OCR berhasil (lunas otomatis)'
                    : icon('alert-triangle') + 'Bukti diteruskan ke verifikasi manual pengelola';
                resultTitle.className = isAuto ? 'val-pos' : 'val-warn';

                const ocr = result.ocr_data || {};
                resultBody.innerHTML = `
                    <p style="margin-bottom: 10px;">${esc(result.message)}</p>
                    <div class="detail">
                        <strong>Detail ekstraksi OCR</strong><br>
                        • Nominal Terbaca: <strong>${ocr.nominal_terbaca ? 'Rp ' + Number(ocr.nominal_terbaca).toLocaleString('id-ID') : 'Tidak Terbaca Jelas'}</strong><br>
                        • Nominal Tagihan: <strong>Rp ${Number(ocr.nominal_tagihan).toLocaleString('id-ID')}</strong><br>
                        • Tanggal Terbaca: ${esc(ocr.tanggal || '-')}<br>
                        • Nama Pengirim: ${esc(ocr.nama_pengirim || '-')}
                    </div>
                `;

                form.reset();
                document.getElementById('image-preview-container').style.display = 'none';
                loadDashboardPenghuni();
            } else {
                notify(result.message || 'Gagal mengunggah bukti.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            notify('Terjadi kesalahan jaringan atau server saat mengunggah.');
        } finally {
            resetBtn();
        }
    });
}

// 5. Muat Riwayat Pembayaran
async function loadRiwayatPembayaran() {
    try {
        const res = await fetch(`${API_URL}/pembayaran`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        const tbody = document.getElementById('tbody-riwayat');

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Belum ada riwayat pembayaran yang diunggah.</td></tr>`;
            return;
        }

        data.forEach(p => {
            const periode = p.tagihan ? `${p.tagihan.bulan_tagihan}/${p.tagihan.tahun_tagihan}` : '-';
            const totalTagihan = p.tagihan ? `Rp ${Number(p.tagihan.total_tagihan).toLocaleString('id-ID')}` : '-';
            const ocrNominal = p.ocr_nominal_terbaca ? `Rp ${Number(p.ocr_nominal_terbaca).toLocaleString('id-ID')}` : '<span class="cell-muted">-</span>';
            const pengirim = p.ocr_nama_pengirim || '-';
            const tglUpload = p.tanggal_upload ? new Date(p.tanggal_upload).toLocaleString('id-ID') : '-';

            tbody.innerHTML += `
                <tr>
                    <td>${tglUpload}</td>
                    <td><strong>${periode}</strong></td>
                    <td>${totalTagihan}</td>
                    <td>${ocrNominal}</td>
                    <td>${pengirim}</td>
                    <td><span class="badge ${getBadgeClass(p.status_verifikasi)}">${formatStatus(p.status_verifikasi)}</span></td>
                    <td>
                        ${p.url_bukti_transfer
                            ? `<button type="button" class="btn-outline btn-sm" onclick="viewBukti('${p.url_bukti_transfer}')">Lihat Bukti</button>`
                            : '-'
                        }
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Gagal memuat riwayat pembayaran:', err);
    }
}

// 6. Asisten Virtual AI (8 Opsi Sesuai kos.md)
async function tanyaAI(optionId) {
    const responseBox = document.getElementById('ai-response-box');
    const loadingIndicator = document.getElementById('ai-loading-indicator');

    loadingIndicator.style.display = 'inline';
    responseBox.innerHTML = '<em>Menghubungkan ke layanan AI dan mengambil data sistem kos Anda...</em>';

    try {
        const res = await fetch(`${API_URL}/ai/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ optionId })
        });

        const data = await res.json();

        if (res.ok) {
            responseBox.innerHTML = `
                <div class="ai-question">
                    Pertanyaan: "${data.pertanyaan}"
                </div>
                <div>${formatAIText(data.jawaban)}</div>
            `;
        } else {
            responseBox.innerHTML = `<span class="ai-error">${data.message || data.error || 'Gagal memproses pertanyaan.'}</span>`;
        }
    } catch (err) {
        responseBox.innerHTML = `<span class="ai-error">Gagal terhubung ke server asisten AI.</span>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// 7. Profil Penghuni
async function loadProfil() {
    try {
        const res = await fetch(`${API_URL}/penghuni/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const json = await res.json();
            const p = json.data;
            penghuniProfilCache = p;
            if (p) {
                document.getElementById('prof-nama').textContent = p.users?.nama_lengkap || currentUser.nama_lengkap;
                document.getElementById('prof-email').textContent = p.users?.email || currentUser.email;
                document.getElementById('prof-telepon').textContent = p.users?.no_telepon || '-';
                document.getElementById('prof-kamar').textContent = p.kamar?.nomor_kamar ? `Kamar No. ${p.kamar.nomor_kamar}` : '-';
                document.getElementById('prof-tarif').textContent = p.kamar?.tarif_bulanan ? `Rp ${Number(p.kamar.tarif_bulanan).toLocaleString('id-ID')} / bulan` : '-';
                document.getElementById('prof-tgl-masuk').textContent = p.tanggal_masuk ? new Date(p.tanggal_masuk).toLocaleDateString('id-ID') : '-';
                document.getElementById('prof-status').textContent = p.status_aktif ? 'Aktif' : 'Non-Aktif';
            }
        }
    } catch (e) {
        console.warn('Gagal memuat profil penghuni:', e);
    }
}

function openEditProfilModal() {
    if (!penghuniProfilCache) return;
    document.getElementById('edit_prof_nama').value = penghuniProfilCache.users?.nama_lengkap || currentUser.nama_lengkap || '';
    document.getElementById('edit_prof_telepon').value = penghuniProfilCache.users?.no_telepon || '';
    document.getElementById('edit_prof_password').value = '';
    document.getElementById('modalEditProfil').classList.add('active');
}

function closeEditProfilModal() {
    document.getElementById('modalEditProfil').classList.remove('active');
}

function setupEditProfilListener() {
    const form = document.getElementById('editProfilForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('edit_prof_nama').value.trim();
        const telepon = document.getElementById('edit_prof_telepon').value.trim();
        const password = document.getElementById('edit_prof_password').value;

        const payload = {
            nama_lengkap: nama,
            no_telepon: telepon
        };
        if (password && password.trim() !== '') {
            payload.password = password;
        }

        try {
            const res = await fetch(`${API_URL}/penghuni/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                notify('Profil berhasil diperbarui!');
                closeEditProfilModal();

                // Perbarui localStorage userKos
                if (currentUser) {
                    currentUser.nama_lengkap = nama;
                    localStorage.setItem('userKos', JSON.stringify(currentUser));
                    document.getElementById('welcomeMessage').textContent = `Halo, ${nama}`;
                }

                loadProfil();
            } else {
                notify(result.message || 'Gagal memperbarui profil.');
            }
        } catch (err) {
            notify('Terjadi kesalahan saat memperbarui profil.');
        }
    });
}

// Utilitas Helper
function getBadgeClass(status) {
    if (!status) return 'badge-belum';
    const s = status.toLowerCase();
    if (s === 'lunas' || s === 'valid_otomatis' || s === 'valid_manual' || s === 'disetujui') return 'badge-lunas';
    if (s === 'menunggu_verifikasi' || s === 'butuh_pengecekan_manual') return 'badge-menunggu';
    if (s === 'ditolak') return 'badge-ditolak';
    if (s === 'terlambat') return 'badge-telat';
    return 'badge-belum';
}

function formatStatus(status) {
    if (!status) return '-';
    const map = {
        'belum_bayar': 'Belum Bayar',
        'menunggu_verifikasi': 'Menunggu Verifikasi',
        'valid_otomatis': 'Valid Otomatis (OCR)',
        'valid_manual': 'Disetujui Manual',
        'butuh_pengecekan_manual': 'Pengecekan Manual',
        'lunas': 'Lunas',
        'terlambat': 'Terlambat',
        'ditolak': 'Ditolak'
    };
    return map[status] || status;
}

function formatAIText(text) {
    if (!text) return '';
    return esc(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function viewBukti(url) {
    const modal = document.getElementById('modalBukti');
    const img = document.getElementById('modalBuktiImg');
    img.src = url;
    modal.classList.add('active');
    document.getElementById('modalBuktiClose')?.focus();
}

function closeModalBukti() {
    const modal = document.getElementById('modalBukti');
    modal.classList.remove('active');
}
