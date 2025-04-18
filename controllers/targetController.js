const db = require('../config/db');
// Get all target records with optional filtering by shift, month, and year, and include karyawan name
exports.getAllTargets = (req, res) => {
    const { nama_shift, nama_game, bulan, tahun } = req.query; // Ambil parameter dari query

    let sql = `
        SELECT t.id_target, t.nip, kar.nama AS nama_karyawan, t.target, t.tanggal, 
               t.id_game, game.nama_game, t.ket,
               COALESCE(k.total_koin, 0) AS total_koin,
               COALESCE(g.gaji_kotor, 0) AS gaji_kotor,
               ROUND(COALESCE((k.total_koin / t.target) * 100, 0), 2) AS persentase,
               s.nama_shift
        FROM target t
        LEFT JOIN (
            SELECT id_koin, nip, SUM(jumlah) AS total_koin 
            FROM koin 
            GROUP BY id_koin, nip
        ) k ON t.id_koin = k.id_koin AND t.nip = k.nip
        LEFT JOIN (
            SELECT g1.nip, MAX(g1.tgl_transaksi) AS latest_tgl, MAX(g1.gaji_kotor) AS gaji_kotor
            FROM gaji g1
            GROUP BY g1.nip
        ) g ON t.nip = g.nip
        LEFT JOIN game ON t.id_game = game.id_game
        LEFT JOIN karyawan kar ON t.nip = kar.NIP
        LEFT JOIN shift s ON kar.id_shift = s.id_shift
    `;

    const params = [];
    const filters = [];

    // Filter berdasarkan shift (jika ada)
    if (nama_shift) {
        filters.push(`s.nama_shift = ?`);
        params.push(nama_shift);
    }

    // Filter berdasarkan nama game (jika ada)
    if (nama_game) {
        filters.push(`game.nama_game = ?`);
        params.push(nama_game);
    }

    // Filter berdasarkan bulan (jika ada)
    if (bulan) {
        filters.push(`MONTH(t.tanggal) = ?`);
        params.push(bulan);
    }

    // Filter berdasarkan tahun (jika ada)
    if (tahun) {
        filters.push(`YEAR(t.tanggal) = ?`);
        params.push(tahun);
    }

    // Tambahkan WHERE jika ada filter
    if (filters.length > 0) {
        sql += ` WHERE ` + filters.join(" AND ");
    }

    sql += `
        GROUP BY t.id_target, t.nip, kar.nama, t.target, t.tanggal, t.id_game, game.nama_game, 
                 k.total_koin, g.gaji_kotor, s.nama_shift, t.ket
        ORDER BY t.tanggal DESC;
    `;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching targets", error: err });

        res.status(200).json({ message: "Data target berhasil diambil", data: results });
    });
};



// Get target by NIP with saldo_koin from the corresponding id_koin
exports.getTargetByNIP = (req, res) => {
    const { nip } = req.params;

    const sql = `
        SELECT t.*, game.nama_game, k.saldo_koin
        FROM target t
        LEFT JOIN game ON t.id_game = game.id_game
        LEFT JOIN koin k ON t.id_koin = k.id_koin
        WHERE t.nip = ?;
    `;

    db.query(sql, [nip], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching target", error: err });
        if (results.length === 0) return res.status(404).json({ message: `Tidak ada target untuk NIP ${nip}` });

        res.status(200).json({ message: `Data target untuk NIP ${nip} berhasil diambil`, data: results });
    });
};

// Create new target
exports.createTarget = (req, res) => {
    const { nip, target, tanggal, nama_game, ket } = req.body;

    if (!nip || !target || !tanggal || !nama_game) {
        return res.status(400).json({ message: "NIP, target, tanggal, dan nama game harus diisi" });
    }

    const sql = 
        `INSERT INTO target (nip, target, tanggal, id_game, persentase, ket) 
        VALUES (?, ?, ?, 
            (SELECT id_game FROM game WHERE nama_game = ? LIMIT 1),
            (SELECT ROUND(COALESCE((k.saldo_koin / ?)*100, 0), 2) FROM koin k WHERE k.nip = ? ORDER BY k.tanggal DESC LIMIT 1),
            ?
        )`;

    db.query(sql, [nip, target, tanggal, nama_game, target, nip, ket || null], (err, results) => {
        if (err) return res.status(500).json({ message: "Error creating target", error: err });

        res.status(201).json({ 
            message: "Target berhasil ditambahkan", 
            data: { id_target: results.insertId, nip, target, tanggal, nama_game, ket } 
        });
    });
};

// Update target
exports.updateTarget = (req, res) => {
    const { id } = req.params;
    const { target, tanggal, nama_game, ket } = req.body;

    if (!target || !tanggal || !nama_game) {
        return res.status(400).json({ message: "Target, tanggal, dan nama game harus diisi" });
    }

    const sql = 
        `UPDATE target 
        SET target = ?, tanggal = ?, 
            id_koin = (SELECT id_koin FROM koin WHERE nip = (SELECT nip FROM target WHERE id_target = ?) ORDER BY tanggal DESC LIMIT 1), 
            id_gaji = (SELECT id_gaji FROM gaji WHERE nip = (SELECT nip FROM target WHERE id_target = ?) ORDER BY tgl_transaksi DESC LIMIT 1), 
            id_game = (SELECT id_game FROM game WHERE nama_game = ? LIMIT 1),
            persentase = (SELECT ROUND(COALESCE((k.saldo_koin / ?)*100, 0), 2) FROM koin k WHERE k.nip = (SELECT nip FROM target WHERE id_target = ?) ORDER BY k.tanggal DESC LIMIT 1),
            ket = ?
        WHERE id_target = ?`;

    db.query(sql, [target, tanggal, id, id, nama_game, target, id, ket || null, id], (err, results) => {
        if (err) return res.status(500).json({ message: "Error updating target", error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: "Target tidak ditemukan" });

        res.status(200).json({ message: "Target berhasil diperbarui", data: { id_target: id, target, tanggal, nama_game, ket } });
    });
};


// Delete target
exports.deleteTarget = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM target WHERE id_target = ?';

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Error deleting target", error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: "Target tidak ditemukan" });

        res.status(200).json({ message: "Target berhasil dihapus" });
    });
};
