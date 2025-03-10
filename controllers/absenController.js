const db = require('../config/db');

exports.absen = (req, res) => {
    const { NIP, tipe } = req.body;

    if (!NIP || !tipe) {
        return res.status(400).json({ message: "NIP dan tipe wajib diisi" });
    }

    if (!['masuk', 'pulang'].includes(tipe)) {
        return res.status(400).json({ message: "Tipe harus 'masuk' atau 'pulang'" });
    }

    const tanggal = new Date().toISOString().split('T')[0];
    const status = 'hadir';

    // Insert absen tanpa pengecekan sebelumnya
    const insertQuery = `INSERT INTO absen (NIP, waktu, tanggal, status, tipe) VALUES (?, NOW(), ?, ?, ?)`;

    db.query(insertQuery, [NIP, tanggal, status, tipe], (err, result) => {
        if (err) {
            console.error("Error saat menyimpan absen:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server" });
        }

        res.status(201).json({ message: "Absen berhasil dicatat", NIP, tipe, status });
    });
};


exports.absenIzin = (req, res) => {
    const { NIP } = req.body;

    if (!NIP) {
        return res.status(400).json({ message: "NIP wajib diisi" });
    }

    // Cek apakah NIP ada di database
    const checkNIPQuery = `SELECT * FROM karyawan WHERE NIP = ?`;

    db.query(checkNIPQuery, [NIP], (err, results) => {
        if (err) {
            console.error("Error saat memeriksa NIP:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server" });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "NIP tidak ditemukan dalam database" });
        }

        // Ambil tanggal hari ini
        const tanggal = new Date().toISOString().split("T")[0];

        // Cek apakah sudah ada izin/tidak masuk untuk hari ini
        const checkIzinQuery = `SELECT * FROM absen WHERE NIP = ? AND status = 'izin' AND tanggal = CURDATE()`;

        db.query(checkIzinQuery, [NIP], (err, results) => {
            if (err) {
                console.error("Error saat mengecek izin terakhir:", err);
                return res.status(500).json({ message: "Terjadi kesalahan pada server" });
            }

            // Jika sudah ada izin untuk hari ini, tetap izinkan input
            const status = "izin";
            const insertQuery = `INSERT INTO absen (NIP, waktu, tanggal, status, tipe) VALUES (?, NOW(), ?, ?, NULL)`;

            db.query(insertQuery, [NIP, tanggal, status], (err, result) => {
                if (err) {
                    console.error("Error saat menyimpan izin:", err);
                    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
                }

                res.status(201).json({ message: "Izin berhasil dicatat", NIP, status });
            });
        });
    });
};

exports.absenTidakMasuk = (req, res) => {
    const { NIP } = req.body;

    if (!NIP) {
        return res.status(400).json({ message: "NIP wajib diisi" });
    }

    // Cek apakah NIP ada di database
    const checkNIPQuery = `SELECT * FROM karyawan WHERE NIP = ?`;

    db.query(checkNIPQuery, [NIP], (err, results) => {
        if (err) {
            console.error("Error saat memeriksa NIP:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server" });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "NIP tidak ditemukan dalam database" });
        }

        // Ambil tanggal hari ini
        const tanggal = new Date().toISOString().split("T")[0];

        // Cek apakah sudah ada tidak masuk untuk hari ini
        const checkTidakMasukQuery = `SELECT * FROM absen WHERE NIP = ? AND status = 'tidak_masuk' AND tanggal = CURDATE()`;

        db.query(checkTidakMasukQuery, [NIP], (err, results) => {
            if (err) {
                console.error("Error saat mengecek tidak masuk terakhir:", err);
                return res.status(500).json({ message: "Terjadi kesalahan pada server" });
            }

            // Jika sudah ada tidak masuk untuk hari ini, tetap izinkan input
            const status = "tidak_masuk";
            const insertQuery = `INSERT INTO absen (NIP, waktu, tanggal, status, tipe) VALUES (?, NOW(), ?, ?, NULL)`;

            db.query(insertQuery, [NIP, tanggal, status], (err, result) => {
                if (err) {
                    console.error("Error saat menyimpan tidak masuk:", err);
                    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
                }

                res.status(201).json({ message: "Tidak Masuk berhasil dicatat", NIP, status });
            });
        });
    });
};


// **2. Rekap absen berdasarkan NIP dan rentang tanggal**
exports.getAbsenRekapByNIP = (req, res) => {
    const { NIP } = req.params;
    
    // Tentukan rentang tanggal (dapat disesuaikan)
    const startDate = '2025-01-01';
    const endDate = '2025-02-28';  

    const sql = `
        SELECT 
            NIP,
            COUNT(CASE WHEN status = 'hadir' THEN 1 END) AS total_hadir,
            COUNT(CASE WHEN status = 'izin' THEN 1 END) AS total_izin,
            COUNT(CASE WHEN status = 'tidak_masuk' THEN 1 END) AS total_tidak_masuk
        FROM absen
        WHERE NIP = ? AND tanggal BETWEEN ? AND ?
        GROUP BY NIP
    `;

    db.query(sql, [NIP, startDate, endDate], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error pada server', error: err });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Data absen tidak ditemukan' });
        }

        const rekap = results[0];
        res.status(200).json({
            message: 'Rekap absen berhasil diambil',
            data: {
                NIP: rekap.NIP,
                total_hadir: rekap.total_hadir,
                total_izin: rekap.total_izin,
                total_tidak_masuk: rekap.total_tidak_masuk
            }
        });
    });
};


exports.getStatusByNIP = (req, res) => {
    const { NIP } = req.params;
    const sql = `SELECT status, tipe, tanggal, waktu 
                 FROM absen 
                 WHERE NIP = ? 
                 ORDER BY tanggal DESC, waktu DESC`;

    db.query(sql, [NIP], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error pada server', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Data tidak ditemukan untuk NIP ini' });
        }

        res.status(200).json(results);
    });
};

exports.scanQR = (req, res) => {
    const { NIP } = req.params;

    if (!NIP) {
        return res.status(400).json({ message: "NIP wajib diisi" });
    }

    const sql = `SELECT NIP, nama FROM karyawan WHERE NIP = ?`;

    db.query(sql, [NIP], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error pada server", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }

        // Ambil data NIP & nama
        const { NIP, nama } = results[0];

        // Redirect ke frontend dengan query parameter
        const frontendURL = `https://absensi.harvestdigital.id/scan_absensi?nip=${NIP}&nama=${encodeURIComponent(nama)}`;
        res.redirect(frontendURL);
    });
};

exports.getAbsenByNIP = (req, res) => {
    const { NIP } = req.params;
    const { start_date, end_date } = req.query;

    let sql = `SELECT * FROM absen WHERE NIP = ?`;
    let params = [NIP];

    // Tambahkan filter tanggal jika diberikan
    if (start_date && end_date) {
        sql += ` AND tanggal BETWEEN ? AND ?`;
        params.push(start_date, end_date);
    }

    sql += ` ORDER BY tanggal DESC, waktu DESC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error pada server", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Data absen tidak ditemukan untuk NIP ini" });
        }

        res.status(200).json({ message: "Data absen berhasil diambil", data: results });
    });
};

exports.getAllAbsensi = (req, res) => {
    const { nama, tanggal, nama_shift, status } = req.query;

    let sql = `
        SELECT 
            k.NIP, 
            k.nama,
            s.nama_shift,
            COALESCE(MAX(CASE WHEN a.tipe = 'masuk' AND a.tanggal = ? THEN a.tanggal END), NULL) AS tanggal_masuk,
            COALESCE(MAX(CASE WHEN a.tipe = 'masuk' AND a.tanggal = ? THEN DATE_FORMAT(a.waktu, '%Y-%m-%d %H:%i:%s') END), NULL) AS waktu_masuk,
            COALESCE(MAX(CASE WHEN a.tipe = 'pulang' AND a.tanggal = ? THEN DATE_FORMAT(a.waktu, '%Y-%m-%d %H:%i:%s') END), NULL) AS waktu_pulang,
            (CASE 
                WHEN MAX(CASE WHEN a.tipe = 'masuk' AND a.tanggal = ? THEN 1 ELSE 0 END) = 1 THEN 'masuk'
                ELSE 'belum absen'
            END) AS status
        FROM karyawan k
        LEFT JOIN absen a ON k.NIP = a.NIP AND a.tanggal = ?
        LEFT JOIN shift s ON k.id_shift = s.id_shift
        WHERE 1=1
    `;

    let params = [];

    // Gunakan tanggal yang dipilih, jika tidak ada gunakan tanggal hari ini
    const filterTanggal = tanggal || new Date().toISOString().split('T')[0];

    // Tambahkan tanggal ke parameter query sebanyak 5 kali (karena dipakai dalam 5 kondisi)
    params.push(filterTanggal, filterTanggal, filterTanggal, filterTanggal, filterTanggal);

    // Filter berdasarkan nama jika diberikan
    if (nama) {
        sql += ` AND k.nama LIKE ?`;
        params.push(`%${nama}%`);
    }

    // Filter berdasarkan shift jika diberikan
    if (nama_shift) {
        sql += ` AND s.nama_shift = ?`;
        params.push(nama_shift);
    }

    sql += ` GROUP BY k.NIP, k.nama, s.nama_shift`;

    // Filter berdasarkan status jika diberikan
    if (status) {
        sql += ` HAVING status = ?`;
        params.push(status);
    }

    sql += ` ORDER BY k.nama ASC`;

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error pada server", error: err });
        }

        if (results.length === 0) {
            return res.status(200).json({ message: "Data ditemukan, tetapi tidak ada absensi untuk tanggal tersebut", data: [] });
        }

        res.status(200).json({ message: "Data karyawan dan absensi berhasil diambil", data: results });
    });
};
