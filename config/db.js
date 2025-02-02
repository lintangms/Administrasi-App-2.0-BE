const mysql = require("mysql");
const dotenv = require("dotenv");

// Konfigurasi environment variable
dotenv.config();

// Koneksi ke database menggunakan konfigurasi dari .env
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi ke database gagal:", err);
    process.exit(1);
  }
  console.log("Koneksi ke database berhasil!");
});

module.exports = db;
