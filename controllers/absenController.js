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

    // Cek tipe terakhir berdasarkan NIP
    const checkLastAbsenQuery = `SELECT tipe FROM absen WHERE NIP = ? ORDER BY waktu DESC LIMIT 1`;

    db.query(checkLastAbsenQuery, [NIP], (err, results) => {
        if (err) {
            console.error("Error saat mengecek tipe terakhir:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server" });
        }

        // Jika ada data absen terakhir
        if (results.length > 0) {
            const lastTipe = results[0].tipe;

            // Jika tipe terakhir adalah 'masuk' dan user mencoba absen 'masuk' lagi, tolak
            if (lastTipe === 'masuk' && tipe === 'masuk') {
                return res.status(400).json({ message: "Anda sudah melakukan absen masuk, silakan lakukan absen pulang terlebih dahulu." });
            }

            // Jika tipe terakhir adalah 'pulang' dan user mencoba absen 'pulang' lagi, tolak
            if (lastTipe === 'pulang' && tipe === 'pulang') {
                return res.status(400).json({ message: "Anda sudah melakukan absen pulang, silakan lakukan absen masuk terlebih dahulu." });
            }
        }

        // Jika valid, lakukan insert absen
        const status = 'hadir';
        const insertQuery = `INSERT INTO absen (NIP, waktu, tanggal, status, tipe) VALUES (?, NOW(), ?, ?, ?)`;

        db.query(insertQuery, [NIP, tanggal, status, tipe], (err, result) => {
            if (err) {
                console.error("Error saat menyimpan absen:", err);
                return res.status(500).json({ message: "Terjadi kesalahan pada server" });
            }

            res.status(201).json({ message: "Absen berhasil dicatat", NIP, tipe, status });
        });
    });
};

// **2. Rekap absen berdasarkan NIP dan rentang tanggal**
exports.getAbsenRekapByNIP = (req, res) => {
    const { NIP } = req.params;
    
    // Tentukan rentang tanggal
    const startDate = '2025-01-01'; // Bisa diganti sesuai kebutuhan
    const endDate = '2025-02-28';   // Perbaikan dari 31 Februari ke 28 Februari

    const sql = `
        SELECT 
            NIP,
            COUNT(CASE WHEN status = 'hadir' AND tipe = 'masuk' THEN 1 END) AS total_hadir,
            COUNT(CASE WHEN status = 'izin' AND tipe = 'masuk' THEN 1 END) AS total_izin,
            COUNT(CASE WHEN status = 'tidak_masuk' AND tipe = 'masuk' THEN 1 END) AS total_tidak_masuk
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
    const { nama, tanggal } = req.query;

    let sql = `
        SELECT 
            k.NIP, 
            k.nama,
            COALESCE(MAX(CASE WHEN a.tipe = 'masuk' AND a.tanggal = ? THEN a.tanggal END), NULL) AS tanggal_masuk,
            COALESCE(MAX(CASE WHEN a.tipe = 'masuk' AND a.tanggal = ? THEN DATE_FORMAT(a.waktu, '%Y-%m-%d %H:%i:%s') END), NULL) AS waktu_masuk,
            COALESCE(MAX(CASE WHEN a.tipe = 'pulang' AND a.tanggal = ? THEN a.tanggal END), NULL) AS tanggal_pulang,
            COALESCE(MAX(CASE WHEN a.tipe = 'pulang' AND a.tanggal = ? THEN DATE_FORMAT(a.waktu, '%Y-%m-%d %H:%i:%s') END), NULL) AS waktu_pulang
        FROM karyawan k
        LEFT JOIN absen a ON k.NIP = a.NIP
        WHERE 1=1
    `;

    let params = [];

    // Gunakan tanggal yang dipilih, jika tidak ada gunakan tanggal hari ini
    const filterTanggal = tanggal || new Date().toISOString().split('T')[0];

    // Tambahkan tanggal ke parameter query sebanyak 4 kali (karena dipakai dalam 4 kondisi)
    params.push(filterTanggal, filterTanggal, filterTanggal, filterTanggal);

    // Filter berdasarkan nama jika diberikan
    if (nama) {
        sql += ` AND k.nama LIKE ?`;
        params.push(`%${nama}%`);
    }

    sql += ` GROUP BY k.NIP, k.nama ORDER BY k.nama ASC`;

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
