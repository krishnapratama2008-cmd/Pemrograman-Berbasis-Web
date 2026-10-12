Pertanyaan Modul 6
1. Jelaskan mengapa validasi client-side tidak boleh menjadi satu-satunya lapisan validasi pada aplikasi web.
   Validasi client-side hanya berfungsi untuk memberi user experience (UX) yang responsif dan cepat.
   Namun, validasi ini berjalan di browser pengguna sehingga sangat mudah dilewati (misalnya dengan mematikan JavaScript, mengedit kodenya lewat Inspect Element, atau langsung mengirim Request via Postman/cURL).
   Oleh karena itu, validasi server-side tetap wajib sebagai pertahanan utama untuk mencegah data rusak dan melindungi sistem dari bahaya keamanan (seperti SQL Injection atau XSS).
   
2. Sebutkan minimal tiga atribut validasi bawaan HTML5 beserta fungsinya masing-masing.
   - required: Mencegah formulir dikirim jika input masih kosong.
   - min / max: Membatasi batas nilai terkecil dan terbesar (cocok untuk angka, tanggal, atau waktu).
   - pattern: Memastikan isi input sesuai dengan pola teks tertentu menggunakan Regular Expression (misal: format nomor HP atau KTP).
  
3. Jelaskan perbedaan antara input.checkValidity() dan input.reportValidity().
   - input.checkValidity(): Hanya mengecek status valid/tidaknya input secara diam-diam dan mengembalikan nilai boolean (true atau false). Tidak menampilkan pop-up error di browser.
   - input.reportValidity(): Sama-sama mengecek validitas, namun jika ditemukan error, fungsi ini langsung menampilkan pesan pop-up error bawaan browser ke layar pengguna.

4. Apa fungsi setCustomValidity("") (string kosong), dan mengapa penting memanggilnya kembali setelah error diperbaiki?
   - Fungsi: Memanggil setCustomValidity("") (string kosong) berfungsi untuk menghapus pesan error kustom dan mengembalikan status input menjadi valid.
   - Alasan Penting: Jika pesan error kustom tidak di-reset ke string kosong setelah kesalahan diperbaiki, browser akan terus menganggap input tersebut invalid dan menolak pengiriman formulir.

5. Rancang aturan validasi (beserta pseudocode) agar field "Tanggal Lahir" tidak boleh berada di masa depan.
   1. Ambil elemen input dan tanggal hari ini
   inputTanggal = AmbilNilaiInput("tanggal_lahir")
   tanggalHariIni = TanggalHariIni()

   2. Logika Pengecekan
   JIKA inputTanggal > tanggalHariIni MAKA
    // Set pesan error
    inputTanggal.setCustomValidity("Tanggal lahir tidak boleh di masa depan")
   LAINNYA
    // Reset pesan error agar kembali valid
    inputTanggal.setCustomValidity("")
   AKHIR JIKA

  3. Tampilkan pesan jika ada error
  inputTanggal.reportValidity()
