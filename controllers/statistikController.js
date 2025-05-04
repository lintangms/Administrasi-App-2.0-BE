const db = require('../config/db');

exports.getStatistik = (req, res) => {
    const { nama_game, bulan, tahun, shift } = req.query;

    const bulanFilter = bulan || new Date().getMonth() + 1;
    const tahunFilter = tahun || new Date().getFullYear();

    const sqlKaryawan = `
        SELECT COUNT(k.id_karyawan) AS jumlah_karyawan 
        FROM karyawan k
    `;

    const sqlFarming = `
        SELECT SUM(pf.koin) AS total_farming
        FROM perolehan_farming pf
        JOIN game g ON pf.id_game = g.id_game
        JOIN karyawan k ON pf.NIP = k.NIP
        JOIN shift s ON k.id_shift = s.id_shift
        WHERE (? IS NULL OR g.nama_game = ?)
        AND MONTH(pf.periode) = ?
        AND YEAR(pf.periode) = ?
        AND (? IS NULL OR s.nama_shift = ?);
    `;

    const sqlBoosting = `
        SELECT SUM(pb.nominal) AS total_boosting
        FROM perolehan_boosting pb
        JOIN game g ON pb.id_game = g.id_game
        JOIN karyawan k ON pb.NIP = k.NIP
        JOIN shift s ON k.id_shift = s.id_shift
        WHERE (? IS NULL OR g.nama_game = ?)
        AND MONTH(pb.periode) = ?
        AND YEAR(pb.periode) = ?
        AND (? IS NULL OR s.nama_shift = ?);
    `;

    const sqlInventaris = `
        SELECT COUNT(i.id_inventaris) AS jumlah_inventaris
        FROM inventaris i;
    `;

    db.query(sqlKaryawan, [shift, shift], (err, resultKaryawan) => {
        if (err) return res.status(500).json({ message: "Error fetching karyawan data", error: err });

        db.query(sqlFarming, [nama_game, nama_game, bulanFilter, tahunFilter, shift, shift], (err, resultFarming) => {
            if (err) return res.status(500).json({ message: "Error fetching farming data", error: err });

            db.query(sqlBoosting, [nama_game, nama_game, bulanFilter, tahunFilter, shift, shift], (err, resultBoosting) => {
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

// Statistik Perolehan Farming per NIP (1 data terbaru per NIP berdasarkan ID koin terbesar)
exports.getStatistikFarming = (req, res) => {
    const { bulan, tahun, nama_game, shift } = req.query;

    const bulanFilter = bulan || new Date().getMonth() + 1;
    const tahunFilter = tahun || new Date().getFullYear();

    const sql = `
        SELECT 
            k.nip, 
            k.nama,
            COALESCE(kt.saldo_koin, 0) AS total_saldo_koin,
            COALESCE(kt.dijual, 0) AS total_dijual
        FROM karyawan k
        JOIN jabatan j ON k.id_jabatan = j.id_jabatan
        JOIN shift s ON k.id_shift = s.id_shift
        LEFT JOIN (
            SELECT k1.*
            FROM koin k1
            INNER JOIN (
                SELECT MAX(id_koin) AS id_koin
                FROM koin
                WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?
                GROUP BY nip
            ) k2 ON k1.id_koin = k2.id_koin
        ) kt ON k.nip = kt.nip
        LEFT JOIN game g ON kt.id_game = g.id_game
        WHERE j.nama_jabatan = 'FARMER'
            AND (? IS NULL OR g.nama_game = ?)
            AND (? IS NULL OR s.nama_shift = ?)
        ORDER BY k.nip;
    `;

    db.query(
        sql,
        [bulanFilter, tahunFilter, nama_game, nama_game, shift, shift],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Error fetching farming statistics",
                    error: err,
                });
            }

            res.status(200).json(results);
        }
    );
};


// Statistik Perolehan Boosting per NIP dengan filter bulan, tahun, nama_game, dan shift
exports.getStatistikBoosting = (req, res) => {
    const { bulan, tahun, nama_game, shift } = req.query;

    const bulanFilter = bulan || new Date().getMonth() + 1;
    const tahunFilter = tahun || new Date().getFullYear();

    const sql = `
        SELECT k.nip, k.nama, COALESCE(SUM(pb.nominal), 0) AS total_boosting
        FROM karyawan k
        JOIN jabatan j ON k.id_jabatan = j.id_jabatan
        JOIN shift s ON k.id_shift = s.id_shift
        LEFT JOIN perolehan_boosting pb 
            ON k.nip = pb.nip 
            AND MONTH(pb.periode) = ? 
            AND YEAR(pb.periode) = ?
        LEFT JOIN game g 
            ON pb.id_game = g.id_game
        WHERE j.nama_jabatan = 'BOOSTER'
            AND (? IS NULL OR g.nama_game = ?)
            AND (? IS NULL OR s.nama_shift = ?)
        GROUP BY k.nip, k.nama
        ORDER BY k.nip;
    `;

    db.query(sql, [bulanFilter, tahunFilter, nama_game, nama_game, shift, shift], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching boosting statistics", error: err });

        res.status(200).json(results);
    });
};

// Statistik Perolehan Farming per Tahun dengan filter shift
exports.getStatistikFarmingPerTahun = (req, res) => {
    const { tahun, nama_game, shift } = req.query;

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
        LEFT JOIN karyawan k ON pf.nip = k.nip
        LEFT JOIN shift s ON k.id_shift = s.id_shift
        WHERE (? IS NULL OR g.nama_game = ?)
            AND (? IS NULL OR s.nama_shift = ?)
        GROUP BY m.bulan
        ORDER BY m.bulan;
    `;

    db.query(sql, [tahunFilter, nama_game, nama_game, shift, shift], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching farming statistics", error: err });

        res.status(200).json(results);
    });
};

// Statistik Perolehan Boosting per Tahun dengan filter shift
exports.getStatistikBoostingPerTahun = (req, res) => {
    const { tahun, nama_game, shift } = req.query;

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
        LEFT JOIN karyawan k ON pb.nip = k.nip
        LEFT JOIN shift s ON k.id_shift = s.id_shift
        WHERE (? IS NULL OR g.nama_game = ?)
            AND (? IS NULL OR s.nama_shift = ?)
        GROUP BY m.bulan
        ORDER BY m.bulan;
    `;

    db.query(sql, [tahunFilter, nama_game, nama_game, shift, shift], (err, results) => {
        if (err) return res.status(500).json({ message: "Error fetching boosting statistics", error: err });

        res.status(200).json(results);
    });
};
