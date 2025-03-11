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
    const {
        NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja,
        nama_jabatan, nama_divisi, username, password, ket,
        username_akun, nama_game, nama_shift
    } = req.body;

    const hashedPassword = password ? md5(password) : null;
    const gambar = req.file ? req.file.filename : null;

    const getId = (table, column, value) => {
        return new Promise((resolve, reject) => {
            if (!value) return resolve(null);
            db.query(`SELECT id_${table} FROM ${table} WHERE ${column} = ?`, [value], (err, result) => {
                if (err) return reject(err);
                resolve(result.length > 0 ? result[0][`id_${table}`] : null);
            });
        });
    };

    Promise.all([
        getId('jabatan', 'nama_jabatan', nama_jabatan),
        getId('divisi', 'nama_divisi', nama_divisi),
        getId('akun', 'username_steam', username_akun),
        getId('game', 'nama_game', nama_game),
        getId('shift', 'nama_shift', nama_shift)
    ]).then(([id_jabatan, id_divisi, id_akun, id_game, id_shift]) => {
        const sql = `INSERT INTO karyawan (NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja, 
                        id_jabatan, id_divisi, username, password, ket, gambar, id_akun, id_game, id_shift)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.query(sql, [NIP, nama, alamat, telp, ttl, pendidikan, status, mulai_bekerja,
            id_jabatan, id_divisi, username, hashedPassword, ket, gambar, id_akun, id_game, id_shift],
            (err, result) => {
                if (err) return res.status(500).json({ message: 'Error creating karyawan', error: err });
                res.status(201).json({ message: 'Karyawan created successfully', karyawanId: result.insertId });
            });
    }).catch(err => res.status(500).json({ message: 'Database error', error: err }));
};

exports.updateKaryawan = (req, res) => {
    const { id_karyawan } = req.params;
    const {
        NIP, nama, alamat, telp, pendidikan, status,
        nama_jabatan, nama_divisi, username, ket,
        username_akun, nama_game, nama_shift
    } = req.body;

    const gambar = req.file ? req.file.filename : null;

    const getId = (table, column, value) => {
        return new Promise((resolve, reject) => {
            if (!value) return resolve(null);
            db.query(`SELECT id_${table} FROM ${table} WHERE ${column} = ?`, [value], (err, result) => {
                if (err) return reject(err);
                resolve(result.length > 0 ? result[0][`id_${table}`] : null);
            });
        });
    };

    Promise.all([
        getId('jabatan', 'nama_jabatan', nama_jabatan),
        getId('divisi', 'nama_divisi', nama_divisi),
        getId('akun', 'username_steam', username_akun),
        getId('game', 'nama_game', nama_game),
        getId('shift', 'nama_shift', nama_shift)
    ]).then(([id_jabatan, id_divisi, id_akun, id_game, id_shift]) => {
        const sql = `UPDATE karyawan SET 
                        NIP = COALESCE(?, NIP), nama = COALESCE(?, nama), alamat = COALESCE(?, alamat), 
                        telp = COALESCE(?, telp), pendidikan = COALESCE(?, pendidikan), 
                        status = COALESCE(?, status), 
                        id_jabatan = COALESCE(?, id_jabatan), id_divisi = COALESCE(?, id_divisi), 
                        username = COALESCE(?, username), ket = COALESCE(?, ket), 
                        gambar = COALESCE(?, gambar),
                        id_akun = COALESCE(?, id_akun), id_game = COALESCE(?, id_game), id_shift = COALESCE(?, id_shift)
                     WHERE id_karyawan = ?`;
        db.query(sql, [NIP, nama, alamat, telp, pendidikan, status,
            id_jabatan, id_divisi, username, ket, gambar,
            id_akun, id_game, id_shift, id_karyawan],
            (err, result) => {
                if (err) return res.status(500).json({ message: 'Error updating karyawan', error: err });
                if (result.affectedRows === 0) return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
                res.status(200).json({ message: 'Karyawan updated successfully' });
            });
    }).catch(err => res.status(500).json({ message: 'Database error', error: err }));
};




exports.updateGambarByNIP = (req, res) => {
    const { NIP } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'Gambar baru wajib diupload' });
    }

    const gambar = req.file.filename;

    const sql = 'UPDATE karyawan SET gambar = ? WHERE NIP = ?';
    db.query(sql, [gambar, NIP], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating gambar', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
        }
        res.status(200).json({ message: 'Gambar berhasil diperbarui' });
    });
};



// Get all karyawan with filtering
exports.getAllKaryawan = (req, res) => {
    const { nama, nama_game, nama_shift, nama_jabatan, status } = req.query;

    let sql = `
        SELECT k.*, j.nama_jabatan, d.nama_divisi, g.nama_game, s.nama_shift
        FROM karyawan k
        LEFT JOIN jabatan j ON k.id_jabatan = j.id_jabatan
        LEFT JOIN divisi d ON k.id_divisi = d.id_divisi
        LEFT JOIN game g ON k.id_game = g.id_game
        LEFT JOIN shift s ON k.id_shift = s.id_shift
    `;

    let conditions = [];
    let params = [];

    if (nama) {
        conditions.push("k.nama LIKE ?");
        params.push(`%${nama}%`);
    }

    if (nama_game) {
        conditions.push("g.nama_game = ?");
        params.push(nama_game);
    }

    if (nama_shift) {
        conditions.push("s.nama_shift = ?");
        params.push(nama_shift);
    }

    if (nama_jabatan) {
        conditions.push("j.nama_jabatan = ?");
        params.push(nama_jabatan);
    }

    if (status) {
        conditions.push("k.status = ?");
        params.push(status);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY k.id_karyawan DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching karyawan", error: err });
        }

        // Tambahkan URL lengkap untuk gambar
        const dataWithPhoto = results.map((karyawan) => ({
            ...karyawan,
            gambar: karyawan.gambar ? `${req.protocol}://${req.get("host")}/uploads/${karyawan.gambar}` : null,
        }));

        res.status(200).json({ message: "Data karyawan berhasil diambil", data: dataWithPhoto });
    });
};


// Get all karyawan dengan status "BARU"
exports.getAllKaryawanBaru = (req, res) => {
    const sql = `SELECT NIP, nama 
                 FROM karyawan 
                 WHERE status = 'BARU'`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching karyawan', error: err });
        } else {
            res.status(200).json(results);
        }
    });
};


// Get a single karyawan by NIP
exports.getKaryawanByNIP = (req, res) => {
    const { nip } = req.params; // Mengambil parameter NIP dari request

    const sql = `
        SELECT k.*, 
               j.nama_jabatan, 
               d.nama_divisi, 
               a.username_steam, 
               g.nama_game, 
               s.nama_shift
        FROM karyawan k
        LEFT JOIN jabatan j ON k.id_jabatan = j.id_jabatan
        LEFT JOIN divisi d ON k.id_divisi = d.id_divisi
        LEFT JOIN akun a ON k.id_akun = a.id_akun
        LEFT JOIN game g ON k.id_game = g.id_game
        LEFT JOIN shift s ON k.id_shift = s.id_shift
        WHERE k.NIP = ?
    `;

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