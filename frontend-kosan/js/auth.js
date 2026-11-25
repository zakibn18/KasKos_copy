const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://kas-kos-copy.vercel.app/api';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');

function showAlert(message, type) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = 'block';
}

// Handler untuk halaman Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        
        btn.textContent = 'Memproses...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok && result.token) {
                showAlert('Login berhasil! Mengalihkan ke dashboard...', 'success');
                localStorage.setItem('token', result.token);
                localStorage.setItem('userKos', JSON.stringify(result.user));
                
                setTimeout(() => {
                    const role = (result.user.role || '').toLowerCase();
                    if (['pemilik', 'admin', 'pengelola'].includes(role)) {
                        window.location.href = 'dashboard-pengelola.html'; 
                    } else {
                        window.location.href = 'dashboard-penghuni.html';
                    }
                }, 1000);
            } else {
                showAlert(result.message || 'Login gagal, periksa email & password.', 'error');
            }
        } catch (error) {
            showAlert('Gagal terhubung ke server. Periksa koneksi internet lalu coba lagi.', 'error');
        } finally {
            btn.textContent = 'Masuk';
            btn.disabled = false;
        }
    });
}

// Handler untuk halaman Register
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            nama_lengkap: document.getElementById('nama').value.trim(),
            email: document.getElementById('email').value.trim(),
            no_telepon: document.getElementById('telepon').value.trim(),
            role: document.getElementById('role').value,
            password: document.getElementById('password').value
        };

        const btn = registerForm.querySelector('button[type="submit"]');
        btn.textContent = 'Memproses...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showAlert('Pendaftaran sukses! Silakan login.', 'success');
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showAlert(result.message || 'Pendaftaran gagal.', 'error');
            }
        } catch (error) {
            showAlert('Gagal terhubung ke server backend.', 'error');
        } finally {
            btn.textContent = 'Daftar Sekarang';
            btn.disabled = false;
        }
    });
}
