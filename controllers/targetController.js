const db = require('../config/db');
// Get all target records without filtering
exports.getAllTargets = (req, res) => {
    const sql = `
        SELECT t.id_target, t.nip, t.target, t.tanggal, t.id_game, game.nama_game,
            COALESCE(k.saldo_koin, 0) AS saldo_koin,
            COALESCE(g.gaji_kotor, 0) AS gaji_kotor,
            ROUND(COALESCE((k.saldo_koin / t.target) * 100, 0), 2) AS persentase
        FROM target t
        LEFT JOIN koin k ON t.id_koin = k.id_koin
        LEFT JOIN (
            SELECT g1.nip, MAX(g1.tgl_transaksi) AS latest_tgl, MAX(g1.gaji_kotor) AS gaji_kotor
            FROM gaji g1
            GROUP BY g1.nip
        ) g ON t.nip = g.nip
        LEFT JOIN game ON t.id_game = game.id_game
        GROUP BY t.id_target, t.nip, t.target, t.tanggal, t.id_game, game.nama_game, k.saldo_koin, g.gaji_kotor
        ORDER BY t.tanggal DESC;
    `;

    db.query(sql, (err, results) => {
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
    const { nip, target, tanggal, nama_game } = req.body;

    if (!nip || !target || !tanggal || !nama_game) {
        return res.status(400).json({ message: "NIP, target, tanggal, dan nama game harus diisi" });
    }

    const sql = 
        `INSERT INTO target (nip, target, tanggal, id_game, persentase) 
        VALUES (?, ?, ?, 
            (SELECT id_game FROM game WHERE nama_game = ? LIMIT 1),
            (SELECT ROUND(COALESCE((k.saldo_koin / ?)*100, 0), 2) FROM koin k WHERE k.nip = ? ORDER BY k.tanggal DESC LIMIT 1)
        )`;

    db.query(sql, [nip, target, tanggal, nama_game, target, nip], (err, results) => {
        if (err) return res.status(500).json({ message: "Error creating target", error: err });

        res.status(201).json({ 
            message: "Target berhasil ditambahkan", 
            data: { id_target: results.insertId, nip, target, tanggal, nama_game } 
        });
    });
};


// Update target
exports.updateTarget = (req, res) => {
    const { id } = req.params;
    const { target, tanggal, nama_game } = req.body;

    if (!target || !tanggal || !nama_game) {
        return res.status(400).json({ message: "Target, tanggal, dan nama game harus diisi" });
    }

    const sql = 
        `UPDATE target 
        SET target = ?, tanggal = ?, 
            id_koin = (SELECT id_koin FROM koin WHERE nip = (SELECT nip FROM target WHERE id_target = ?) ORDER BY tanggal DESC LIMIT 1), 
            id_gaji = (SELECT id_gaji FROM gaji WHERE nip = (SELECT nip FROM target WHERE id_target = ?) ORDER BY tgl_transaksi DESC LIMIT 1), 
            id_game = (SELECT id_game FROM game WHERE nama_game = ? LIMIT 1),
            persentase = (SELECT ROUND(COALESCE((k.saldo_koin / ?)*100, 0), 2) FROM koin k WHERE k.nip = (SELECT nip FROM target WHERE id_target = ?) ORDER BY k.tanggal DESC LIMIT 1)
        WHERE id_target = ?`;

    db.query(sql, [target, tanggal, id, id, nama_game, target, id, id], (err, results) => {
        if (err) return res.status(500).json({ message: "Error updating target", error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: "Target tidak ditemukan" });

        res.status(200).json({ message: "Target berhasil diperbarui", data: { id_target: id, target, tanggal, nama_game } });
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
