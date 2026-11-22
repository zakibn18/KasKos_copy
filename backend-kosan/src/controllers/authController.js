const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(401).json({ status: 'error', message: 'Email atau password salah!' });
        }

        if (password !== data.password) {
            return res.status(401).json({ status: 'error', message: 'Email atau password salah!' });
        }

        const roleNormalized = (data.role || '').toLowerCase();
        const token = jwt.sign(
            { id: data.id, email: data.email, role: roleNormalized },
            process.env.JWT_SECRET || 'kaskos-secret-key-default-2026',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil!',
            token,
            user: {
                id: data.id,
                nama_lengkap: data.nama_lengkap,
                email: data.email,
                role: data.role,
                role_normalized: roleNormalized
            }
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server', error: err.message });
    }
};

const register = async (req, res) => {
    // Registrasi publik dinonaktifkan untuk mencegah pembuatan akun pengelola/penghuni ilegal
    return res.status(403).json({
        status: 'error',
        message: 'Registrasi publik dinonaktifkan demi keamanan sistem. Akun penghuni hanya dapat didaftarkan oleh Pengelola Kos melalui menu Data Penghuni.'
    });
};

module.exports = { login, register };
