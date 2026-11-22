const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://kas-kos-copy.vercel.app/api';

let token = localStorage.getItem('token');
let currentUser = null;
let penghuniListCache = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
    loadDashboardData();
});

// 1. Autentikasi Pengelola
function checkAuth() {
    const userDataString = localStorage.getItem('userKos');
    token = localStorage.getItem('token');

    if (!userDataString || !token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        currentUser = JSON.parse(userDataString);
    } catch (e) {
        window.location.href = 'index.html';
        return;
    }

    const role = (currentUser.role || '').toLowerCase();
    if (!['pengelola', 'pemilik', 'admin'].includes(role)) {
        alert('Akses Ditolak: Hanya pengelola yang dapat membuka halaman ini.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('welcomeMessage').textContent = `Halo, ${currentUser.nama_lengkap || 'Pengelola'}`;
}

function logout() {
    if (confirm('Keluar dari akun pengelola?')) {
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

            if (targetId === 'page-dashboard') loadDashboardData();
            if (targetId === 'page-kamar') loadKamar();
            if (targetId === 'page-penghuni') loadPenghuni();
            if (targetId === 'page-tagihan') loadTagihan();
            if (targetId === 'page-verifikasi') loadVerifikasi();
            if (targetId === 'page-kas') loadKas();
        });
    });
}

function toggleForm(showId, hideId) {
    document.getElementById(showId).style.display = 'block';
    document.getElementById(hideId).style.display = 'none';
}

// 3. Dashboard Data Ringkasan
async function loadDashboardData() {
    try {
        // Ambil data kas
        const resKas = await fetch(`${API_URL}/kas`, { headers: { Authorization: `Bearer ${token}` } });
        if (resKas.ok) {
            const jsonKas = await resKas.json();
            const r = jsonKas.ringkasan || {};
            document.getElementById('dash-saldo').textContent = `Rp ${(r.saldoAkhir || 0).toLocaleString('id-ID')}`;
            document.getElementById('dash-pemasukan').textContent = `Rp ${(r.totalPemasukan || 0).toLocaleString('id-ID')}`;
            document.getElementById('dash-pengeluaran').textContent = `Rp ${(r.totalPengeluaran || 0).toLocaleString('id-ID')}`;
        }

        // Ambil data kamar
        const resKamar = await fetch(`${API_URL}/kamar`);
        let kamarList = [];
        if (resKamar.ok) {
            const jsonKamar = await resKamar.json();
            kamarList = jsonKamar.data || [];
            const terisi = kamarList.filter(k => k.status_kamar === 'Terisi').length;
            document.getElementById('dash-kamar-stat').textContent = `${terisi} / ${kamarList.length}`;
        }

        // Ambil data penghuni
        const resPenghuni = await fetch(`${API_URL}/penghuni`, { headers: { Authorization: `Bearer ${token}` } });
        if (resPenghuni.ok) {
            const jsonPenghuni = await resPenghuni.json();
            const penghuniList = jsonPenghuni.data || [];
            const aktif = penghuniList.filter(p => p.status_aktif).length;
            document.getElementById('dash-penghuni-stat').textContent = `${aktif} Orang`;
        }

        // Ambil data tagihan & hitung penunggak
        const resTagihan = await fetch(`${API_URL}/tagihan`, { headers: { Authorization: `Bearer ${token}` } });
        if (resTagihan.ok) {
            const jsonTagihan = await resTagihan.json();
            const tagihanList = jsonTagihan.data || [];
            
            const penunggak = tagihanList.filter(t => t.status_tagihan !== 'lunas');
            document.getElementById('dash-penunggak').textContent = `${penunggak.length} Tagihan`;

            const tbodyDash = document.getElementById('tbody-dash-tagihan');
            tbodyDash.innerHTML = '';
            if (tagihanList.length === 0) {
                tbodyDash.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 16px;">Belum ada tagihan yang dibuat.</td></tr>`;
            } else {
                tagihanList.slice(0, 5).forEach(t => {
                    const nama = t.penghuni?.users?.nama_lengkap || 'Penghuni';
                    const kamar = t.penghuni?.kamar?.nomor_kamar || '-';
                    tbodyDash.innerHTML += `
                        <tr>
                            <td>${nama}</td>
                            <td>Kamar ${kamar}</td>
                            <td>${t.bulan_tagihan}/${t.tahun_tagihan}</td>
                            <td>Rp ${Number(t.total_tagihan).toLocaleString('id-ID')}</td>
                            <td>${t.tanggal_jatuh_tempo || '-'}</td>
                            <td><span class="badge ${getBadgeClass(t.status_tagihan)}">${formatStatus(t.status_tagihan)}</span></td>
                        </tr>
                    `;
                });
            }
        }
    } catch (err) {
        console.error('Gagal memuat dashboard data:', err);
    }
}

// 4. Manajemen Kamar
async function loadKamar() {
    try {
        const res = await fetch(`${API_URL}/kamar`);
        const result = await res.json();
        const tbody = document.getElementById('tbody-kamar');
        tbody.innerHTML = '';

        if (result.data && result.data.length > 0) {
            result.data.forEach(k => {
                const badgeClass = k.status_kamar === 'Tersedia' ? 'badge-lunas' : 'badge-menunggu';
                tbody.innerHTML += `
                    <tr>
                        <td><strong>Kamar ${k.nomor_kamar}</strong></td>
                        <td>Rp ${parseInt(k.tarif_bulanan).toLocaleString('id-ID')}</td>
                        <td><span class="badge ${badgeClass}">${k.status_kamar}</span></td>
                        <td><button class="btn-danger" onclick="hapusKamar('${k.id}')">Hapus</button></td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Belum ada data kamar terdaftar.</td></tr>`;
        }
    } catch (err) {
        console.error("Gagal memuat kamar:", err);
    }
}

document.getElementById('kamarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nomor_kamar: document.getElementById('nomor_kamar').value.trim(),
        tarif_bulanan: document.getElementById('tarif_bulanan').value,
        status_kamar: document.getElementById('status_kamar').value
    };

    try {
        const res = await fetch(`${API_URL}/kamar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            alert('Kamar berhasil ditambahkan!');
            document.getElementById('kamarForm').reset();
            toggleForm('tabel-kamar-container', 'form-kamar');
            loadKamar();
        } else {
            alert(result.message || 'Gagal menambahkan kamar.');
        }
    } catch (err) {
        alert('Gagal menyimpan kamar.');
    }
});

async function hapusKamar(id) {
    if (!confirm('Yakin ingin menghapus kamar ini?')) return;
    try {
        const res = await fetch(`${API_URL}/kamar/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Kamar berhasil dihapus.');
            loadKamar();
        } else {
            const err = await res.json();
            alert(err.message || 'Gagal menghapus kamar.');
        }
    } catch (e) {
        alert('Terjadi kesalahan saat menghapus kamar.');
    }
}

// 5. Data Penghuni
async function loadPenghuni() {
    try {
        const res = await fetch(`${API_URL}/penghuni`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        const tbody = document.getElementById('tbody-penghuni');
        tbody.innerHTML = '';

        penghuniListCache = result.data || [];

        if (penghuniListCache.length > 0) {
            penghuniListCache.forEach(p => {
                const nama = p.users ? p.users.nama_lengkap : '-';
                const email = p.users ? p.users.email : '-';
                const telepon = p.users ? p.users.no_telepon : '-';
                const kamar = p.kamar ? `Kamar ${p.kamar.nomor_kamar}` : '-';
                const tgl = p.tanggal_masuk ? new Date(p.tanggal_masuk).toLocaleDateString('id-ID') : '-';
                const statusBadge = p.status_aktif ? 'badge-lunas' : 'badge-ditolak';

                tbody.innerHTML += `
                    <tr>
                        <td><strong>${nama}</strong></td>
                        <td>${email}</td>
                        <td>${telepon}</td>
                        <td>${kamar}</td>
                        <td>${tgl}</td>
                        <td><span class="badge ${statusBadge}">${p.status_aktif ? 'Aktif' : 'Non-Aktif'}</span></td>
                        <td>
                            <button class="btn-outline" style="font-size: 11px; padding: 4px 8px;" onclick="toggleStatusPenghuni('${p.id}', ${!p.status_aktif})">
                                ${p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">Belum ada penghuni terdaftar.</td></tr>`;
        }

        // Muat opsi kamar kosong untuk form tambah penghuni
        const resKamar = await fetch(`${API_URL}/kamar?status=Tersedia`);
        const resKam = await resKamar.json();
        const selKamar = document.getElementById('p_kamar');
        selKamar.innerHTML = '<option value="" disabled selected>-- Pilih Kamar Tersedia --</option>';
        if (resKam.data && resKam.data.length > 0) {
            resKam.data.forEach(k => {
                selKamar.innerHTML += `<option value="${k.id}">Kamar ${k.nomor_kamar} (Rp ${Number(k.tarif_bulanan).toLocaleString('id-ID')}/bln)</option>`;
            });
        } else {
            selKamar.innerHTML = '<option value="" disabled>Tidak ada kamar tersedia (tambah kamar dulu)</option>';
        }

    } catch (err) {
        console.error('Gagal memuat penghuni:', err);
    }
}

document.getElementById('penghuniForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nama_lengkap: document.getElementById('p_nama').value.trim(),
        email: document.getElementById('p_email').value.trim(),
        password: document.getElementById('p_password').value,
        no_telepon: document.getElementById('p_telepon').value.trim(),
        kamar_id: document.getElementById('p_kamar').value
    };

    try {
        const res = await fetch(`${API_URL}/penghuni/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            alert('Penghuni berhasil didaftarkan!');
            document.getElementById('penghuniForm').reset();
            toggleForm('tabel-penghuni-container', 'form-penghuni');
            loadPenghuni();
        } else {
            alert(result.message || 'Gagal mendaftarkan penghuni.');
        }
    } catch (err) {
        alert('Gagal mendaftarkan penghuni.');
    }
});

async function toggleStatusPenghuni(id, newStatus) {
    try {
        const res = await fetch(`${API_URL}/penghuni/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status_aktif: newStatus })
        });
        if (res.ok) {
            loadPenghuni();
        }
    } catch (e) {
        alert('Gagal mengubah status penghuni.');
    }
}

// 6. Manajemen Tagihan
async function loadTagihan() {
    try {
        // Ambil daftar penghuni untuk dropdown form buat tagihan
        const resPenghuni = await fetch(`${API_URL}/penghuni`, { headers: { Authorization: `Bearer ${token}` } });
        if (resPenghuni.ok) {
            const jsonPenghuni = await resPenghuni.json();
            penghuniListCache = jsonPenghuni.data || [];
            const sel = document.getElementById('t_penghuni');
            sel.innerHTML = '<option value="">-- Pilih Penghuni --</option>';
            penghuniListCache.forEach(p => {
                if (p.status_aktif) {
                    sel.innerHTML += `<option value="${p.id}" data-tarif="${p.kamar?.tarif_bulanan || 0}">${p.users?.nama_lengkap} (Kamar ${p.kamar?.nomor_kamar || '-'})</option>`;
                }
            });
        }

        // Default bulan dan tanggal jatuh tempo
        const currMonth = new Date().getMonth() + 1;
        document.getElementById('t_bulan').value = currMonth;
        const now = new Date();
        const defaultDueDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0];
        document.getElementById('t_jatuh_tempo').value = defaultDueDate;

        // Ambil data tagihan
        const resTagihan = await fetch(`${API_URL}/tagihan`, { headers: { Authorization: `Bearer ${token}` } });
        const jsonTagihan = await resTagihan.json();
        const list = jsonTagihan.data || [];
        const tbody = document.getElementById('tbody-tagihan');
        tbody.innerHTML = '';

        if (list.length > 0) {
            list.forEach(t => {
                const nama = t.penghuni?.users?.nama_lengkap || '-';
                const kamar = t.penghuni?.kamar?.nomor_kamar || '-';
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${t.bulan_tagihan}/${t.tahun_tagihan}</strong></td>
                        <td>${nama}</td>
                        <td>Kamar ${kamar}</td>
                        <td>Rp ${Number(t.nominal_dasar).toLocaleString('id-ID')}</td>
                        <td>Rp ${Number(t.nominal_denda || 0).toLocaleString('id-ID')}</td>
                        <td><strong style="color:var(--accent);">Rp ${Number(t.total_tagihan).toLocaleString('id-ID')}</strong></td>
                        <td>${t.tanggal_jatuh_tempo || '-'}</td>
                        <td><span class="badge ${getBadgeClass(t.status_tagihan)}">${formatStatus(t.status_tagihan)}</span></td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">Belum ada tagihan yang diterbitkan.</td></tr>`;
        }
    } catch (err) {
        console.error('Gagal memuat tagihan:', err);
    }
}

function onPenghuniTagihanSelected() {
    const sel = document.getElementById('t_penghuni');
    const selectedOpt = sel.options[sel.selectedIndex];
    const tarif = selectedOpt.getAttribute('data-tarif');
    if (tarif && Number(tarif) > 0) {
        document.getElementById('t_nominal_dasar').value = tarif;
    }
}

document.getElementById('tagihanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        penghuni_id: document.getElementById('t_penghuni').value,
        bulan_tagihan: document.getElementById('t_bulan').value,
        tahun_tagihan: document.getElementById('t_tahun').value,
        nominal_dasar: document.getElementById('t_nominal_dasar').value,
        nominal_denda: document.getElementById('t_nominal_denda').value || 0,
        tanggal_jatuh_tempo: document.getElementById('t_jatuh_tempo').value
    };

    try {
        const res = await fetch(`${API_URL}/tagihan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            alert('Tagihan berhasil diterbitkan!');
            document.getElementById('tagihanForm').reset();
            toggleForm('tabel-tagihan-container', 'form-buat-tagihan');
            loadTagihan();
        } else {
            alert(result.message || 'Gagal menerbitkan tagihan.');
        }
    } catch (err) {
        alert('Terjadi kesalahan saat membuat tagihan.');
    }
});

// 7. Verifikasi Pembayaran (OCR & Pengecekan Manual)
async function loadVerifikasi() {
    try {
        const res = await fetch(`${API_URL}/pembayaran`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        const list = json.data || [];
        const tbody = document.getElementById('tbody-verifikasi');
        tbody.innerHTML = '';

        if (list.length > 0) {
            list.forEach(p => {
                const nama = p.tagihan?.penghuni?.users?.nama_lengkap || 'Penghuni';
                const kamar = p.tagihan?.penghuni?.kamar?.nomor_kamar || '-';
                const periode = p.tagihan ? `${p.tagihan.bulan_tagihan}/${p.tagihan.tahun_tagihan}` : '-';
                const totalTagihan = p.tagihan ? `Rp ${Number(p.tagihan.total_tagihan).toLocaleString('id-ID')}` : '-';
                const ocrNominal = p.ocr_nominal_terbaca ? `Rp ${Number(p.ocr_nominal_terbaca).toLocaleString('id-ID')}` : '<span style="color:var(--text-tertiary)">Tidak Terbaca</span>';
                const tglUpload = p.tanggal_upload ? new Date(p.tanggal_upload).toLocaleString('id-ID') : '-';
                
                const needsManual = p.status_verifikasi === 'butuh_pengecekan_manual' || p.status_verifikasi === 'menunggu_verifikasi';

                tbody.innerHTML += `
                    <tr>
                        <td>${tglUpload}</td>
                        <td><strong>${nama}</strong></td>
                        <td>Kamar ${kamar}</td>
                        <td>${periode}</td>
                        <td>${totalTagihan}</td>
                        <td>${ocrNominal}</td>
                        <td><span class="badge ${getBadgeClass(p.status_verifikasi)}">${formatStatus(p.status_verifikasi)}</span></td>
                        <td>
                            ${p.url_bukti_transfer
                                ? `<button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="viewBukti('${p.url_bukti_transfer}')">Lihat Bukti</button>`
                                : '-'
                            }
                        </td>
                        <td>
                            ${needsManual
                                ? `
                                    <div style="display: flex; gap: 6px;">
                                        <button class="btn-primary" style="padding: 4px 10px; font-size: 11px; background: var(--status-lunas); color: #000;" onclick="verifikasiManual('${p.id}', 'disetujui')">Setujui</button>
                                        <button class="btn-danger" style="padding: 4px 10px; font-size: 11px;" onclick="verifikasiManual('${p.id}', 'ditolak')">Tolak</button>
                                    </div>
                                `
                                : `<span style="color: var(--text-tertiary); font-size: 12px;">Selesai</span>`
                            }
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px;">Belum ada bukti pembayaran yang masuk.</td></tr>`;
        }
    } catch (err) {
        console.error('Gagal memuat verifikasi pembayaran:', err);
    }
}

async function verifikasiManual(pembayaranId, status_verifikasi) {
    const catatan = prompt(`Masukkan catatan untuk penghuni (opsional):`, '') || '';
    try {
        const res = await fetch(`${API_URL}/pembayaran/verifikasi/${pembayaranId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status_verifikasi, catatan_admin: catatan })
        });
        const result = await res.json();
        alert(result.message || 'Status pembayaran berhasil diperbarui!');
        loadVerifikasi();
    } catch (err) {
        alert('Gagal memverifikasi pembayaran.');
    }
}

// 8. Laporan Arus Kas
async function loadKas() {
    try {
        // Set tanggal hari ini di input form kas
        document.getElementById('k_tanggal').value = new Date().toISOString().split('T')[0];

        const res = await fetch(`${API_URL}/kas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        const r = result.ringkasan || {};

        document.getElementById('kas-pemasukan').textContent = `Rp ${(r.totalPemasukan || 0).toLocaleString('id-ID')}`;
        document.getElementById('kas-pengeluaran').textContent = `Rp ${(r.totalPengeluaran || 0).toLocaleString('id-ID')}`;
        document.getElementById('kas-saldo').textContent = `Rp ${(r.saldoAkhir || 0).toLocaleString('id-ID')}`;

        const tbody = document.getElementById('tbody-kas');
        tbody.innerHTML = '';
        const list = result.transaksi || [];

        if (list.length > 0) {
            list.forEach(k => {
                const isPemasukan = k.jenis === 'pemasukan';
                const badgeClass = isPemasukan ? 'badge-lunas' : 'badge-ditolak';
                const sign = isPemasukan ? '+' : '-';
                tbody.innerHTML += `
                    <tr>
                        <td>${k.tanggal_transaksi || '-'}</td>
                        <td>${k.keterangan || '-'}</td>
                        <td><span class="badge ${badgeClass}">${isPemasukan ? 'Pemasukan' : 'Pengeluaran'}</span></td>
                        <td><strong style="color: ${isPemasukan ? 'var(--status-lunas)' : 'var(--status-ditolak)'};">${sign} Rp ${Number(k.nominal).toLocaleString('id-ID')}</strong></td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Belum ada catatan transaksi arus kas.</td></tr>`;
        }
    } catch (err) {
        console.error('Gagal memuat arus kas:', err);
    }
}

document.getElementById('kasForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        jenis: document.getElementById('k_jenis').value,
        nominal: document.getElementById('k_nominal').value,
        tanggal_transaksi: document.getElementById('k_tanggal').value,
        keterangan: document.getElementById('k_keterangan').value.trim()
    };

    try {
        const res = await fetch(`${API_URL}/kas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            alert('Transaksi kas berhasil dicatat!');
            document.getElementById('kasForm').reset();
            toggleForm('tabel-kas-container', 'form-kas');
            loadKas();
        } else {
            alert(result.message || 'Gagal mencatat transaksi kas.');
        }
    } catch (err) {
        alert('Gagal mencatat kas.');
    }
});

// 9. Asisten Virtual AI (8 Opsi Sesuai kos.md)
async function tanyaAI(optionId) {
    const responseBox = document.getElementById('ai-response-box');
    const loadingIndicator = document.getElementById('ai-loading-indicator');

    loadingIndicator.style.display = 'inline';
    responseBox.innerHTML = '<em>Mengambil data real-time kos dan merumuskan jawaban dengan AI Gemini...</em>';

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
                <div style="font-weight: 600; color: var(--accent); margin-bottom: 8px;">
                    Pertanyaan: "${data.pertanyaan}"
                </div>
                <div>${formatAIText(data.jawaban)}</div>
            `;
        } else {
            responseBox.innerHTML = `<span style="color: var(--status-ditolak);">${data.message || data.error || 'Gagal memproses pertanyaan.'}</span>`;
        }
    } catch (err) {
        responseBox.innerHTML = `<span style="color: var(--status-ditolak);">Gagal terhubung ke server asisten AI.</span>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
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
        'ditolak': 'Ditolak'
    };
    return map[status] || status;
}

function formatAIText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function viewBukti(url) {
    const modal = document.getElementById('modalBukti');
    const img = document.getElementById('modalBuktiImg');
    img.src = url;
    modal.classList.add('active');
}

function closeModalBukti() {
    const modal = document.getElementById('modalBukti');
    modal.classList.remove('active');
}
