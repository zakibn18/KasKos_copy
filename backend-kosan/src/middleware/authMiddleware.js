const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token otentikasi tidak ditemukan. Silakan login kembali.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaskos-secret-key-default-2026');
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau telah kedaluwarsa. Silakan login kembali.' });
  }
};

const isPengelola = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (!['pengelola', 'pemilik', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'Akses ditolak: Hanya pengelola kos yang diizinkan.' });
  }
  next();
};

module.exports = { verifyToken, isPengelola };
