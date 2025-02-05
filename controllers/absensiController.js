const db = require('../config/db');
const QRCode = require("qrcode");

exports.generateQRCode = async (req, res) => {
    const { NIP } = req.params;
    const absensiURL = `https://absensi.harvestdigital.id/api/absensi/absensiqr/${NIP}`;

    try {
        const qrCodeDataURL = await QRCode.toDataURL(absensiURL);
        res.json({ qrCode: qrCodeDataURL });
    } catch (err) {
        res.status(500).json({ message: "Gagal membuat QR Code", error: err });
    }
};


exports.absensiMasukByQR = (req, res) => {
    const { NIP } = req.params;

    if (!NIP) {
        return res.status(400).json({ message: "NIP wajib diisi" });
    }

    // Periksa apakah NIP ada di tabel karyawan
    const checkNIP = "SELECT NIP, id_jabatan FROM karyawan WHERE NIP = ?";
    db.query(checkNIP, [NIP], (checkErr, results) => {
        if (checkErr) return res.status(500).json({ message: "Error pada server", error: checkErr });

        if (results.length === 0) {
            return res.status(400).json({ message: "NIP tidak ditemukan di database karyawan" });
        }

        const id_jabatan = results[0].id_jabatan;

        // Periksa absensi terakhir
        const checkAbsensi = "SELECT jam_pulang FROM absensi WHERE NIP = ? ORDER BY jam_masuk DESC LIMIT 1";
        db.query(checkAbsensi, [NIP], (absensiErr, absensiResults) => {
            if (absensiErr) return res.status(500).json({ message: "Error pada server", error: absensiErr });

            // Jika absen terakhir belum ada jam_pulang, tidak boleh absen masuk lagi
            if (absensiResults.length > 0 && !absensiResults[0].jam_pulang) {
                return res.status(400).json({ message: "Anda sudah melakukan absensi masuk. Silakan absen pulang terlebih dahulu." });
            }

            // Insert absensi baru untuk "Masuk"
            const sqlMasuk = "INSERT INTO absensi (NIP, id_jabatan, status, jam_masuk, tanggal) VALUES (?, ?, 'Masuk', NOW(), DATE(NOW()))";
            db.query(sqlMasuk, [NIP, id_jabatan], (err, results) => {
                if (err) return res.status(500).json({ message: "Error pada server", error: err });

                return res.status(201).json({ message: "Absensi Masuk berhasil dicatat", id_absensi: results.insertId });
            });
        });
    });
};

// Absensi Masuk
exports.absensiMasuk = (req, res) => {
    const { NIP, id_jabatan } = req.body;

    // Periksa apakah NIP ada di tabel karyawan
    const checkNIP = 'SELECT NIP FROM karyawan WHERE NIP = ?';
    db.query(checkNIP, [NIP], (checkErr, results) => {
        if (checkErr) return res.status(500).json({ message: 'Error pada server', error: checkErr });

        if (results.length === 0) {
            return res.status(400).json({ message: 'NIP tidak ditemukan di database karyawan' });
        }

        // Periksa absensi terakhir
        const checkAbsensi = 'SELECT jam_pulang FROM absensi WHERE NIP = ? ORDER BY jam_masuk DESC LIMIT 1';
        db.query(checkAbsensi, [NIP], (absensiErr, absensiResults) => {
            if (absensiErr) return res.status(500).json({ message: 'Error pada server', error: absensiErr });

            // Jika absen terakhir belum ada jam_pulang, tidak boleh absen masuk lagi
            if (absensiResults.length > 0 && !absensiResults[0].jam_pulang) {
                return res.status(400).json({ message: 'Anda sudah melakukan absensi masuk. Silakan absen pulang terlebih dahulu.' });
            }

            // Insert absensi baru untuk "Masuk"
            const sqlMasuk = 'INSERT INTO absensi (NIP, id_jabatan, status, jam_masuk, tanggal) VALUES (?, ?, "Masuk", NOW(), DATE(NOW()))';
            db.query(sqlMasuk, [NIP, id_jabatan], (err, results) => {
                if (err) return res.status(500).json({ message: 'Error pada server', error: err });

                return res.status(201).json({ message: 'Absensi Masuk berhasil dicatat', id_absensi: results.insertId });
            });
        });
    });
};


exports.absensiIzin = (req, res) => {
    const { NIP, id_jabatan } = req.body;

    // Periksa apakah NIP ada di tabel karyawan
    const checkNIP = 'SELECT NIP FROM karyawan WHERE NIP = ?';
    db.query(checkNIP, [NIP], (checkErr, results) => {
        if (checkErr) return res.status(500).json({ message: 'Error pada server', error: checkErr });

        if (results.length === 0) {
            return res.status(400).json({ message: 'NIP tidak ditemukan di database karyawan' });
        }

        // Insert absensi baru untuk "Izin"
        const sqlIzin = `
            INSERT INTO absensi (NIP, id_jabatan, status, jam_masuk, jam_pulang, tanggal) 
            VALUES (?, ?, "Izin", NOW(), NOW(), DATE(NOW()))
        `;
        db.query(sqlIzin, [NIP, id_jabatan], (izinErr, izinResults) => {
            if (izinErr) return res.status(500).json({ message: 'Error pada server', error: izinErr });

            return res.status(201).json({ message: 'Absensi Izin berhasil dicatat', id_absensi: izinResults.insertId });
        });
    });
};




// Absensi Pulang
exports.absensiPulang = (req, res) => {
    const { id_absensi } = req.params; // Ambil id dari parameter routes

    // Hanya memperbarui jam_pulang
    const sql = 'UPDATE absensi SET jam_pulang = NOW() WHERE id_absensi = ?';
    db.query(sql, [id_absensi], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Absensi tidak ditemukan' });

        res.status(200).json({ message: 'Jam Pulang berhasil dicatat' });
    });
};



// Check Absensi
exports.checkAbsensi = (req, res) => {
    const { NIP } = req.body;

    // Periksa apakah NIP ada di tabel karyawan
    const checkNIP = 'SELECT NIP FROM karyawan WHERE NIP = ?';
    db.query(checkNIP, [NIP], (checkErr, results) => {
        if (checkErr) return res.status(500).json({ message: 'Error pada server', error: checkErr });

        // Jika NIP tidak ditemukan
        if (results.length === 0) {
            return res.status(400).json({ message: 'NIP tidak ditemukan di database karyawan' });
        }

        // Periksa status absensi
        const checkAbsensi = 'SELECT jam_masuk FROM absensi WHERE NIP = ? ORDER BY jam_masuk DESC LIMIT 1';
        db.query(checkAbsensi, [NIP], (absensiErr, absensiResults) => {
            if (absensiErr) return res.status(500).json({ message: 'Error pada server', error: absensiErr });

            // Kembalikan status absensi
            if (absensiResults.length > 0) {
                return res.status(200).json({ jam_masuk: absensiResults[0].jam_masuk });
            } else {
                return res.status(200).json({ jam_masuk: null });
            }
        });
    });
};

exports.getAllAbsensi = (req, res) => {
    const sql = 'SELECT * FROM absensi ORDER BY jam_masuk DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        res.status(200).json(results);
    });
};

// Get Absensi By ID
// Mengambil absensi berdasarkan NIP
exports.getAbsensiByNip = (req, res) => {
    const { NIP } = req.params;
    const sql = 'SELECT * FROM absensi WHERE NIP = ?';
    db.query(sql, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Absensi tidak ditemukan' });
        res.status(200).json(results[0]);
    });
};

// Get Absensi by id_karyawan
exports.getAbsensiByIdKaryawan = (req, res) => {
    const { id_karyawan } = req.params; // Ambil id_karyawan dari parameter route
    const sql = 'SELECT * FROM absensi WHERE id_karyawan = ? ORDER BY jam_masuk DESC';

    db.query(sql, [id_karyawan], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Absensi tidak ditemukan untuk id_karyawan ini' });
        res.status(200).json(results);
    });
};

// Get Absensi by NIP
exports.getAbsensiByNIP = (req, res) => {
    const { NIP } = req.params; // Ambil NIP dari parameter route
    const sql = 'SELECT * FROM absensi WHERE NIP = ? ORDER BY jam_masuk DESC';

    db.query(sql, [NIP], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Absensi tidak ditemukan untuk NIP ini' });
        res.status(200).json(results);
    });
};

// Get Status by NIP
// Get Status and Jam Masuk by NIP
exports.getStatusByNIP = (req, res) => {
    const { NIP } = req.params; // Ambil NIP dari parameter route
    const sql = 'SELECT status, tanggal FROM absensi WHERE NIP = ? ORDER BY tanggal';

    // Jalankan query ke database
    db.query(sql, [NIP], (err, results) => {
        if (err) {
            // Jika terjadi error saat query
            return res.status(500).json({ message: 'Error pada server', error: err });
        }

        if (results.length === 0) {
            // Jika tidak ada data ditemukan untuk NIP
            return res.status(404).json({ message: 'Data tidak ditemukan untuk NIP ini' });
        }

        // Kirim hasil status dan jam_masuk yang ditemukan
        res.status(200).json(results);
    });
};


// Rekapan absensi berdasarkan NIP dan rentang tanggal yang ditentukan dalam skrip
exports.getAbsensiRekapByNIP = (req, res) => {
    const NIP = req.params.NIP;
    
    // Tentukan rentang tanggal secara langsung di sini
    const startDate = '2025-01-01'; // Tanggal mulai
    const endDate = '2025-01-31';   // Tanggal selesai

    const sql = `
        SELECT 
            NIP,
            COUNT(CASE WHEN status = 'Masuk' THEN 1 END) AS total_masuk,
            COUNT(CASE WHEN status = 'Izin' THEN 1 END) AS total_izin,
            COUNT(CASE WHEN status NOT IN ('Masuk', 'Izin') THEN 1 END) AS total_tidak_absen
        FROM absensi
        WHERE NIP = ? AND tanggal BETWEEN ? AND ?
        GROUP BY NIP
    `;

    db.query(sql, [NIP, startDate, endDate], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error pada server', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Data absensi tidak ditemukan' });

        const rekap = results[0];
        res.status(200).json({
            message: 'Rekap absensi berhasil diambil',
            data: {
                NIP: rekap.NIP,
                total_masuk: rekap.total_masuk,
                total_izin: rekap.total_izin,
                total_tidak_absen: rekap.total_tidak_absen
            }
        });
    });
};


exports.scanAbsensi = (req, res) => {
    const { NIP } = req.params;

    // Query untuk mengambil data karyawan berdasarkan NIP
    const query = 'SELECT NIP, nama FROM karyawan WHERE NIP = ?';

    db.query(query, [NIP], (err, results) => {
        if (err) {
            console.error('Error fetching karyawan data:', err);
            return res.status(500).json({ message: "Gagal mengambil data karyawan", error: err });
        }

        // Jika data karyawan tidak ditemukan
        if (results.length === 0) {
            return res.status(404).json({ message: "Karyawan tidak ditemukan" });
        }

        // Ambil data karyawan
        const karyawan = results[0];
        const { nama, NIP: karyawanNIP } = karyawan;

        // Mengirim data karyawan
        res.json({
            NIP: karyawanNIP,
            nama: nama
        });
    });
};