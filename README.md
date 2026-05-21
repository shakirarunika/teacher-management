# 🏫 SINTESIS (Sistem Integrasi Tenaga Edukasi & Sekolah)

SINTESIS adalah platform manajemen sekolah modern yang mengintegrasikan pengelolaan data administratif sekolah dengan pencatatan aktivitas guru secara real-time. Aplikasi ini dirancang untuk memudahkan **Administrator** dalam mengelola data master sekolah secara terpusat, dan membantu **Guru** dalam mencatat absensi kelas serta menginput penilaian siswa secara efisien melalui antarmuka yang sangat dinamis, responsif, dan premium.

---

## 🚀 Fitur Utama

### 1. 🔑 Dashboard Administrator (Filament v3)
Panel admin yang tangguh, elegan, dan terstruktur untuk memelihara seluruh data master sekolah:
* **Manajemen Guru & Staf**: Registrasi, pengelolaan profil, dan pengaturan hak akses pengguna.
* **Manajemen Siswa**: Kelola data siswa secara lengkap beserta data NIS (Nomor Induk Siswa).
* **Kelas & Mata Pelajaran**: Pembagian kelas secara dinamis serta pemetaan mata pelajaran yang diajarkan.
* **Tahun Ajaran**: Manajemen periode aktif ajaran sekolah guna mendukung keberlanjutan data akademik.
* **Hari Libur**: Integrasi dengan API Hari Libur Nasional untuk sinkronisasi otomatis kalender akademik tahunan.
* **Pelaporan Terpadu**: Rekapitulasi global absensi dan nilai siswa di seluruh tingkat kelas.

### 2. 👩‍🏫 Portal Guru (React + Inertia.js + Framer Motion)
Aplikasi web frontend berkinerja tinggi dengan visual modern, dilengkapi animasi mikro dinamis, glassmorphism, serta transisi tema adaptif yang memudahkan guru dalam melakukan:
* **Manajemen Kehadiran Harian**: Pencatatan kehadiran siswa (*Hadir, Sakit, Izin, Alpha*) secara cepat dan real-time per kelas.
* **Input Nilai Siswa**: Perekaman nilai Tugas, PTS (Penilaian Tengah Semester), dan PAS (Penilaian Akhir Semester) secara massal dan terintegrasi untuk mata pelajaran terkait.
* **Laporan Bulanan & Analisis**: Visualisasi grafis tingkat kehadiran siswa beserta tabel rekap bulanan kelas yang mudah dibaca.
* **Dashboard Informatif**: Menampilkan statistik cepat mengenai rasio kehadiran semester, jumlah kelas yang diampu, serta daftar status pengisian absensi hari ini.

### 3. 🔒 Fitur Keamanan & Pengerasan Sistem (Security Hardening)
Aplikasi ini telah melalui proses pengujian keamanan internal dan pengerasan (hardening) untuk menjamin integritas data:
* **Nonaktifkan Registrasi Publik**: Akses pendaftaran mandiri dari luar sistem dinonaktifkan sepenuhnya. Endpoint `/register` (baik `GET` maupun `POST`) akan mengembalikan respon `404 Not Found` guna mencegah pendaftaran liar oleh pihak tidak berwenang. Akun pengguna hanya dapat dibuat oleh Administrator melalui Filament Panel.
* **Validasi Lintas-Kelas (Cross-Classroom Validation)**: Validasi ketat diterapkan di tingkat pengontrol (`AttendanceController` dan `ScoreController`) untuk memastikan bahwa Guru hanya dapat mengedit, melihat, atau menyimpan absensi dan nilai bagi siswa yang memang terdaftar di kelas yang diampu oleh guru bersangkutan. Ini mencegah celah manipulasi ID siswa lintas kelas.
* **Pencegahan Kebocoran Informasi (Info Leakage)**: Detail versi Laravel dan PHP disembunyikan dari payload halaman publik guna meminimalkan jejak informasi yang dapat dimanfaatkan penyerang.
* **Proteksi Akses Filament**: Filament panel menggunakan hak akses terbatas (hanya admin yang dapat masuk ke rute `/admin`).

---

## 🛠️ Stack Teknologi

* **Backend Framework**: Laravel 11 (PHP 8.2+)
* **Frontend Framework**: React.js & Inertia.js
* **Admin Panel**: Filament PHP v3
* **CSS & Styling**: Tailwind CSS
* **Animations**: Framer Motion
* **Database**: MySQL

---

## 📦 Panduan Instalasi & Penggunaan

Ikuti langkah-langkah di bawah ini untuk menjalankan project ini di komputer lokal Anda:

### 1. Persiapan Awal
Pastikan komputer Anda sudah terinstal **PHP 8.2+**, **Composer**, **Node.js (v18+)**, dan server database seperti **MySQL** (direkomendasikan menggunakan Laragon atau XAMPP).

### 2. Kloning Repositori
```bash
git clone https://github.com/shakirarunika/teacher-management.git
cd teacher-management
```

### 3. Instal Dependensi Backend & Frontend
```bash
# Instal dependensi PHP (Composer)
composer install

# Instal dependensi Javascript (NPM)
npm install
```

### 4. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` dan sesuaikan pengaturan database Anda:
```bash
cp .env.example .env
```
Di dalam file `.env`, atur koneksi database:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=teacher_management_db
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Generate Application Key & Migrasi Database
```bash
# Generate key aplikasi
php artisan key:generate

# Jalankan migrasi database beserta data awal (seeding)
php artisan migrate --seed
```

### 6. Jalankan Server Lokal
Jalankan dev server untuk Laravel dan Vite secara bersamaan:
```bash
# Terminal 1: Menjalankan Laravel server
php artisan serve

# Terminal 2: Menjalankan Vite (Frontend compiler)
npm run dev
```
Aplikasi sekarang dapat diakses di browser melalui alamat `http://127.0.0.1:8000`.

---

## 👤 Akun Demo Default

Setelah menjalankan `php artisan db:seed`, Anda dapat masuk menggunakan akun demo berikut:

| Peran (Role) | Email | Password | Halaman Akses |
|---|---|---|---|
| **Administrator** | `admin@admin.com` | `password` | `/admin` (Filament Panel) |
| **Guru** | `teacher@teacher.com` | `password` | `/dashboard` (Portal Guru) |

---

## 💡 Kustomisasi & Lokalisasi
* **Pemberantasan Suffix Jamak Otomatis (Anti Auto-Pluralization)**: Konfigurasi Filament telah disesuaikan agar penamaan entitas di panel admin menggunakan terminologi bahasa Indonesia yang baik tanpa akhiran `s` bahasa Inggris (contoh: `Data Siswa` alih-alih `Data Siswas`).
