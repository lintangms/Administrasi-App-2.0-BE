const jwt = require("jsonwebtoken");
const md5 = require("md5");
const db = require("../config/db");

// Endpoint login
exports.login = (req, res) => {
    const { username, password } = req.body;

    // Query untuk memeriksa username, password, dan mendapatkan nama jabatan dari tabel jabatan
    const sql = `
        SELECT k.id_karyawan, k.username, k.id_jabatan, j.nama_jabatan, k.NIP 
        FROM karyawan k 
        JOIN jabatan j ON k.id_jabatan = j.id_jabatan 
        WHERE k.username = ? AND k.password = MD5(?)
    `;
    
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: err });
        }

        // Jika data ditemukan
        if (results.length > 0) {
            const user = results[0];

            // Validasi jabatan
            const validJabatan = ["manager", "spv", "direktur", "farmer", "booster"];
            if (!validJabatan.includes(user.nama_jabatan.toLowerCase())) {
                return res.status(403).json({ message: "Jabatan tidak valid" });
            }

            // Buat token JWT dengan payload mencakup id, username, jabatan, dan NIP
            const token = jwt.sign(
                { 
                    id: user.id_karyawan, 
                    username: user.username,
                    jabatan: user.nama_jabatan, // Nama jabatan dari tabel jabatan
                    NIP: user.NIP // Tambahkan NIP ke payload
                },
                process.env.JWT_SECRET, // Menggunakan secret dari .env
                { expiresIn: '1h' } // Token berlaku selama 1 jam
            );

            return res.status(200).json({
                message: 'Login berhasil',
                token,
                user: {
                    id_karyawan: user.id_karyawan,
                    username: user.username,
                    id_jabatan: user.id_jabatan, // Tambahkan id_jabatan ke respons
                    jabatan: user.nama_jabatan, // Nama jabatan untuk ditampilkan di respons
                    NIP: user.NIP // Sertakan NIP dalam respons
                }
            });
        } else {
            // Jika username atau password salah
            return res.status(401).json({ message: 'Username atau password salah!' });
        }
    });
};