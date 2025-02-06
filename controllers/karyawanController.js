const db = require('../config/db');
const md5 = require('md5');
const multer = require('multer');
const path = require('path');

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only images (jpeg, jpg, png) are allowed!'));
        }
    }
}).single('gambar');

const getId = (table, column, value) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id_${table} FROM ${table} WHERE ${column} = ?`;
        db.query(sql, [value], (err, result) => {
            if (err) return reject(err);
            if (result.length === 0) return resolve(null);
            resolve(result[0][`id_${table}`]);
        });
    });
};

exports.createKaryawan = (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file.filename);

    const {
        NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja,
        nama_jabatan, nama_divisi, username, password, ket,
        username_akun, nama_game, nama_shift // Ubah ID menjadi pencarian nama
    } = req.body;

    const hashedPassword = md5(password);
    const gambar = req.file.filename;

    // Cari ID Jabatan
    const sqlJabatan = `SELECT id_jabatan FROM jabatan WHERE nama_jabatan = ?`;
    db.query(sqlJabatan, [nama_jabatan], (err, jabatanResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (jabatanResult.length === 0) return res.status(400).json({ message: 'Jabatan tidak ditemukan' });
        const id_jabatan = jabatanResult[0].id_jabatan;

        // Cari ID Divisi
        const sqlDivisi = `SELECT id_divisi FROM divisi WHERE nama_divisi = ?`;
        db.query(sqlDivisi, [nama_divisi], (err, divisiResult) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (divisiResult.length === 0) return res.status(400).json({ message: 'Divisi tidak ditemukan' });
            const id_divisi = divisiResult[0].id_divisi;

            // Cari ID Akun berdasarkan username
            const sqlAkun = `SELECT id_akun FROM akun WHERE username = ?`;
            db.query(sqlAkun, [username_akun], (err, akunResult) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                const id_akun = akunResult.length > 0 ? akunResult[0].id_akun : null;

                // Cari ID Game berdasarkan nama_game
                const sqlGame = `SELECT id_game FROM game WHERE nama_game = ?`;
                db.query(sqlGame, [nama_game], (err, gameResult) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    const id_game = gameResult.length > 0 ? gameResult[0].id_game : null;

                    // Cari ID Shift berdasarkan nama_shift
                    const sqlShift = `SELECT id_shift FROM shift WHERE nama_shift = ?`;
                    db.query(sqlShift, [nama_shift], (err, shiftResult) => {
                        if (err) return res.status(500).json({ message: 'Database error', error: err });
                        const id_shift = shiftResult.length > 0 ? shiftResult[0].id_shift : null;

                        // Insert data karyawan
                        const sql = `
                            INSERT INTO karyawan (NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja, 
                            id_jabatan, id_divisi, username, password, ket, gambar, id_akun, id_game, id_shift)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;

                        db.query(sql, [NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja,
                            id_jabatan, id_divisi, username, hashedPassword, ket, gambar, id_akun, id_game, id_shift], (err, result) => {
                            if (err) return res.status(500).json({ message: 'Error creating karyawan', error: err });

                            console.log('Karyawan created successfully with ID:', result.insertId);
                            res.status(201).json({ message: 'Karyawan created successfully', karyawanId: result.insertId });
                        });
                    });
                });
            });
        });
    });
};


exports.updateKaryawan = (req, res) => {

    const { id_karyawan } = req.params;
    const {
        NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja,
        nama_jabatan, nama_divisi, username, password, ket,
        username_akun, nama_game, nama_shift
    } = req.body;

    let hashedPassword = password ? md5(password) : null;

    const sqlJabatan = `SELECT id_jabatan FROM jabatan WHERE nama_jabatan = ?`;
    db.query(sqlJabatan, [nama_jabatan], (err, jabatanResult) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (jabatanResult.length === 0) return res.status(400).json({ message: 'Jabatan tidak ditemukan' });
        const id_jabatan = jabatanResult[0].id_jabatan;

        const sqlDivisi = `SELECT id_divisi FROM divisi WHERE nama_divisi = ?`;
        db.query(sqlDivisi, [nama_divisi], (err, divisiResult) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err });
            if (divisiResult.length === 0) return res.status(400).json({ message: 'Divisi tidak ditemukan' });
            const id_divisi = divisiResult[0].id_divisi;

            const sqlAkun = `SELECT id_akun FROM akun WHERE username = ?`;
            db.query(sqlAkun, [username_akun], (err, akunResult) => {
                if (err) return res.status(500).json({ message: 'Database error', error: err });
                const id_akun = akunResult.length > 0 ? akunResult[0].id_akun : null;

                const sqlGame = `SELECT id_game FROM game WHERE nama_game = ?`;
                db.query(sqlGame, [nama_game], (err, gameResult) => {
                    if (err) return res.status(500).json({ message: 'Database error', error: err });
                    const id_game = gameResult.length > 0 ? gameResult[0].id_game : null;

                    const sqlShift = `SELECT id_shift FROM shift WHERE nama_shift = ?`;
                    db.query(sqlShift, [nama_shift], (err, shiftResult) => {
                        if (err) return res.status(500).json({ message: 'Database error', error: err });
                        const id_shift = shiftResult.length > 0 ? shiftResult[0].id_shift : null;

                        const sql = `
                            UPDATE karyawan SET
                            NIP = ?, nama = ?, alamat = ?, telp = ?, ttl = ?, pendidikan = ?, 
                            status = ?, mulai_bekerja = ?, id_jabatan = ?, id_divisi = ?, 
                            username = ?, password = COALESCE(?, password), 
                            ket = ?, id_akun = ?, id_game = ?, id_shift = ?
                            WHERE id_karyawan = ?
                        `;

                        db.query(sql, [NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja,
                            id_jabatan, id_divisi, username, hashedPassword, ket,
                            id_akun, id_game, id_shift, id_karyawan], (err, result) => {
                            if (err) return res.status(500).json({ message: 'Error updating karyawan', error: err });
                            if (result.affectedRows === 0) return res.status(404).json({ message: 'Karyawan tidak ditemukan' });

                            console.log('Karyawan updated successfully:', id_karyawan);
                            res.status(200).json({ message: 'Karyawan updated successfully' });
                        });
                    });
                });
            });
        });
    });
};


// Fungsi lainnya tetap sama...

// Get all karyawan
exports.getAllKaryawan = (req, res) => {
    const sql = `SELECT k.*, j.nama_jabatan, d.nama_divisi 
                 FROM karyawan k 
                 LEFT JOIN jabatan j ON k.id_jabatan = j.id_jabatan
                 LEFT JOIN divisi d ON k.id_divisi = d.id_divisi`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching karyawan', error: err });
        } else {
            // Tambahkan URL lengkap untuk gambar
            const dataWithPhoto = results.map((karyawan) => ({
                ...karyawan,
                gambar: karyawan.gambar ? `${req.protocol}://${req.get('host')}/uploads/${karyawan.gambar}` : null,
            }));
            res.status(200).json(dataWithPhoto);
        }
    });
};
// Get a single karyawan by NIP
exports.getKaryawanByNIP = (req, res) => {
    const { nip } = req.params; // Mengambil parameter NIP dari request

    const sql = `SELECT k.*, j.nama_jabatan, d.nama_divisi 
                 FROM karyawan k 
                 LEFT JOIN jabatan j ON k.id_jabatan = j.id_jabatan
                 LEFT JOIN divisi d ON k.id_divisi = d.id_divisi
                 WHERE k.NIP = ?`;

    db.query(sql, [nip], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching karyawan', error: err });
        } 
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Karyawan not found' });
        }

        const karyawan = result[0];
        karyawan.gambar = karyawan.gambar ? `${req.protocol}://${req.get('host')}/uploads/${karyawan.gambar}` : null;

        // Menentukan query untuk menghitung total koin berdasarkan jabatan
        let koinQuery = '';
        if (karyawan.nama_jabatan === 'booster') {
            koinQuery = `SELECT SUM(nominal) AS total_koin FROM perolehan_boosting WHERE NIP = ?`;
        } else if (karyawan.nama_jabatan === 'farmer') {
            koinQuery = `SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE NIP = ?`;
        }

        if (koinQuery) {
            // Mengambil total koin berdasarkan jabatan
            db.query(koinQuery, [nip], (err, koinResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error fetching total koin data', error: err });
                }

                karyawan.koin_terakhir = koinResult.length > 0 ? koinResult[0].total_koin : 0;
                return res.status(200).json(karyawan);
            });
        } else {
            // Jika jabatan tidak memiliki data koin
            return res.status(200).json(karyawan);
        }
    });
};


// Get a single karyawan by ID
exports.getKaryawanById = (req, res) => {
    const { id } = req.params;

    const sql = `SELECT k.*, j.nama_jabatan, d.nama_divisi 
                 FROM karyawan k 
                 LEFT JOIN jabatan j ON k.id_jabatan = j.id_jabatan
                 LEFT JOIN divisi d ON k.id_divisi = d.id_divisi
                 WHERE k.id_karyawan = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching karyawan', error: err });
        } else if (result.length === 0) {
            res.status(404).json({ message: 'Karyawan not found' });
        } else {
            const karyawan = result[0];
            karyawan.gambar = karyawan.gambar ? `${req.protocol}://${req.get('host')}/uploads/${karyawan.gambar}` : null;

            // Menentukan query untuk menghitung total koin berdasarkan jabatan
            let koinQuery = '';
            if (karyawan.nama_jabatan === 'booster') {
                koinQuery = `SELECT SUM(nominal) AS total_koin FROM perolehan_boosting WHERE NIP = ?`;
            } else if (karyawan.nama_jabatan === 'farmer') {
                koinQuery = `SELECT SUM(koin) AS total_koin FROM perolehan_farming WHERE NIP = ?`;
            }

            if (koinQuery) {
                // Gunakan NIP sebagai parameter query
                db.query(koinQuery, [karyawan.NIP], (err, koinResult) => {
                    if (err) {
                        console.error(err);
                        res.status(500).json({ message: 'Error fetching total koin data', error: err });
                    } else {
                        karyawan.koin_terakhir = koinResult.length > 0 ? koinResult[0].total_koin : 0;
                        res.status(200).json(karyawan);
                    }
                });
            } else {
                // Jika jabatan tidak ditemukan atau tidak memiliki data koin
                res.status(200).json(karyawan);
            }
        }
    });
};





// Delete a karyawan
exports.deleteKaryawan = (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM karyawan WHERE id_karyawan = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error deleting karyawan', error: err });
        } else {
            res.status(200).json({ message: 'Karyawan deleted successfully' });
        }
    });
};

exports.updatePassword = (req, res) => {
    const { nip } = req.params;
    const { old_password, new_password } = req.body;

    // Validasi jika old_password dan new_password ada
    if (!old_password || !new_password) {
        return res.status(400).json({ message: 'Old password and new password are required' });
    }

    // Fungsi untuk hash password menggunakan MD5
    const hashPassword = (password) => {
        return crypto.createHash('md5').update(password).digest('hex');
    };

    // Cek karyawan berdasarkan NIP
    const checkUserQuery = 'SELECT * FROM karyawan WHERE NIP = ?';
    db.query(checkUserQuery, [nip], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error checking user data', error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Karyawan not found' });
        }

        const karyawan = result[0];

        // Validasi password lama (hash dulu)
        const oldPasswordHash = hashPassword(old_password);
        if (karyawan.password !== oldPasswordHash) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Update password baru (hash dulu)
        const newPasswordHash = hashPassword(new_password);
        const updatePasswordQuery = 'UPDATE karyawan SET password = ? WHERE NIP = ?';
        db.query(updatePasswordQuery, [newPasswordHash, nip], (err, updateResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error updating password', error: err });
            }

            res.status(200).json({ message: 'Password updated successfully' });
        });
    });
};