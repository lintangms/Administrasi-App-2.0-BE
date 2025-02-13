const db = require('../config/db');

exports.getStatistik = (req, res) => {
    const sqlKaryawan = "SELECT COUNT(id_karyawan) AS jumlah_karyawan FROM karyawan";
    const sqlFarming = "SELECT SUM(koin) AS total_farming FROM perolehan_farming";
    const sqlBoosting = "SELECT SUM(nominal) AS total_boosting FROM perolehan_boosting";
    const sqlInventaris = "SELECT COUNT(id_inventaris) AS jumlah_inventaris FROM inventaris";

    db.query(sqlKaryawan, (err, resultKaryawan) => {
        if (err) return res.status(500).json({ message: "Error fetching karyawan data", error: err });

        db.query(sqlFarming, (err, resultFarming) => {
            if (err) return res.status(500).json({ message: "Error fetching farming data", error: err });

            db.query(sqlBoosting, (err, resultBoosting) => {
                if (err) return res.status(500).json({ message: "Error fetching boosting data", error: err });

                db.query(sqlInventaris, (err, resultInventaris) => {
                    if (err) return res.status(500).json({ message: "Error fetching inventaris data", error: err });

                    res.status(200).json({
                        jumlah_karyawan: resultKaryawan[0].jumlah_karyawan || 0,
                        total_farming: resultFarming[0].total_farming || 0,
                        total_boosting: resultBoosting[0].total_boosting || 0,
                        jumlah_inventaris: resultInventaris[0].jumlah_inventaris || 0,
                    });
                });
            });
        });
    });
};


// Statistik Perolehan Farming per NIP dengan filter bulan, tahun, dan nama_game
exports.getStatistikFarming = (req, res) => {
    const { bulan, tahun, nama_game } = req.query;

    // Jika bulan & tahun tidak diisi, pakai bulan & tahun sekarang
    const bulanFilter = bulan || new Date().getMonth() + 1; // Bulan sekarang (1-12)
    const tahunFilter = tahun || new Date().getFullYear(); // Tahun sekarang (YYYY)

    const sql = `
        SELECT k.nip, k.nama,
               COALESCE(SUM(pf.koin), 0) AS total_farming
        FROM karyawan k
        JOIN jabatan j ON k.id_jabatan = j.id_jabatan
        LEFT JOIN perolehan_farming pf 
            ON k.nip = pf.nip 
            AND MONTH(pf.periode) = ? 
            AND YEAR(pf.periode) = ?
        LEFT JOIN game g 
            ON pf.id_game = g.id_game
        WHERE j.nama_jabatan = 'FARMER'
            AND (? IS NULL OR g.nama_game = ?)
        GROUP BY k.nip, k.nama
        ORDER BY k.nip;
    `;

    db.query(sql, [bulanFilter, tahunFilter, nama_game, nama_game], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching farming statistics", error: err });

        res.status(200).json(results);
    });
};

// Statistik Perolehan Boosting per NIP dengan filter bulan, tahun, dan nama_game
exports.getStatistikBoosting = (req, res) => {
    const { bulan, tahun, nama_game } = req.query;

    // Jika bulan & tahun tidak diisi, pakai bulan & tahun sekarang
    const bulanFilter = bulan || new Date().getMonth() + 1; // Bulan sekarang (1-12)
    const tahunFilter = tahun || new Date().getFullYear(); // Tahun sekarang (YYYY)

    const sql = `
        SELECT k.nip, k.nama,
               COALESCE(SUM(pb.nominal), 0) AS total_boosting
        FROM karyawan k
        JOIN jabatan j ON k.id_jabatan = j.id_jabatan
        LEFT JOIN perolehan_boosting pb 
            ON k.nip = pb.nip 
            AND MONTH(pb.periode) = ? 
            AND YEAR(pb.periode) = ?
        LEFT JOIN game g 
            ON pb.id_game = g.id_game
        WHERE j.nama_jabatan = 'BOOSTER'
            AND (? IS NULL OR g.nama_game = ?)
        GROUP BY k.nip, k.nama
        ORDER BY k.nip;
    `;

    db.query(sql, [bulanFilter, tahunFilter, nama_game, nama_game], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching boosting statistics", error: err });

        res.status(200).json(results);
    });
};

// Statistik Perolehan Farming per Tahun
exports.getStatistikFarmingPerTahun = (req, res) => {
    const { tahun, nama_game } = req.query;

    // Jika tahun tidak diisi, pakai tahun sekarang
    const tahunFilter = tahun || new Date().getFullYear();

    const sql = `
        SELECT m.bulan, COALESCE(SUM(pf.koin), 0) AS total_farming
        FROM (
            SELECT 1 AS bulan UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
            UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) m
        LEFT JOIN perolehan_farming pf 
            ON MONTH(pf.periode) = m.bulan 
            AND YEAR(pf.periode) = ?
        LEFT JOIN game g 
            ON pf.id_game = g.id_game
        WHERE (? IS NULL OR g.nama_game = ?)
        GROUP BY m.bulan
        ORDER BY m.bulan;
    `;

    db.query(sql, [tahunFilter, nama_game, nama_game], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching farming statistics", error: err });

        res.status(200).json(results);
    });
};


// Statistik Perolehan Boosting per Tahun
exports.getStatistikBoostingPerTahun = (req, res) => {
    const { tahun, nama_game } = req.query;

    // Jika tahun tidak diisi, pakai tahun sekarang
    const tahunFilter = tahun || new Date().getFullYear();

    const sql = `
        SELECT m.bulan, COALESCE(SUM(pb.nominal), 0) AS total_boosting
        FROM (
            SELECT 1 AS bulan UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
            UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) m
        LEFT JOIN perolehan_boosting pb 
            ON MONTH(pb.periode) = m.bulan 
            AND YEAR(pb.periode) = ?
        LEFT JOIN game g 
            ON pb.id_game = g.id_game
        WHERE (? IS NULL OR g.nama_game = ?)
        GROUP BY m.bulan
        ORDER BY m.bulan;
    `;

    db.query(sql, [tahunFilter, nama_game, nama_game], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching boosting statistics", error: err });

        res.status(200).json(results);
    });
};
