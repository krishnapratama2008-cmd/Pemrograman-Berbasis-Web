"use strict";

const BASE = "https://jsonplaceholder.typicode.com";

// Key localStorage dikumpulkan di satu tempat
const KEY = { tema: "tema", like: "semuaLike", komentar: "komentar" };


/*  HELPER UMUM */

// Singkatan querySelector
const $ = (selector) => document.querySelector(selector);

// Cari elemen terdekat dari target event (aman jika target bukan Element)
const tombolDari = (e, selector) =>
  e.target instanceof Element ? e.target.closest(selector) : null;

/* Modul 3 — pembuat elemen: menggantikan createElement + textContent + appendChild berulang.
   props: text, dataset, selebihnya (type, className, ...) di-assign langsung ke elemen.
   children: elemen atau string (string otomatis jadi text node). */
function el(tag, props = {}, ...children) {
  const { text, dataset, ...rest } = props;
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (dataset) Object.assign(node.dataset, dataset);
  Object.assign(node, rest);
  node.append(...children);
  return node;
}

const buatTombol = (label, action) =>
  el("button", { type: "button", text: label, dataset: { action } });

/* Modul 6 — baca/tulis JSON di localStorage.
   try/catch: data rusak tidak membuat seluruh script berhenti. */
function bacaJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
const simpanJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* Modul 7 & 8 — satu pintu untuk semua fetch (GET, POST, PATCH, DELETE).
   Header JSON dipasang otomatis bila ada body; status non-2xx dilempar sebagai
   error yang membawa .status supaya bisa dibedakan pesannya (B.6). */
async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(BASE + path, {
    method,
    ...(body && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  if (!response.ok) {
    const error = new Error("Status: " + response.status);
    error.status = response.status;
    throw error;
  }
  return response;
}

/* B.6 — Pesan berbeda berdasarkan status code */
function pesanDariStatus(status) {
  if (status === 404) return "Data tidak ditemukan di server.";
  if (status === 400) return "Data yang dikirim tidak valid.";
  if (status >= 500) return "Server sedang bermasalah, coba lagi nanti.";
  return "Terjadi kesalahan tidak terduga.";
}


/* DARK MODE & ASIDE  (Modul 3 · 4 · 6)  */
function toggleTema() {
  const gelap = document.body.classList.toggle("dark-mode");
  localStorage.setItem(KEY.tema, gelap ? "dark" : "light");
}

// Terapkan preferensi tersimpan saat halaman dibuka
document.body.classList.toggle("dark-mode", localStorage.getItem(KEY.tema) === "dark");
$("#btn-tema")?.addEventListener("click", toggleTema);

const kotakAside = $("aside");
$("#btn-info")?.addEventListener("click", () => kotakAside?.classList.toggle("tersembunyi"));

/* Keyboard shortcut "d" untuk dark mode (abaikan saat mengetik) */
document.addEventListener("keydown", (e) => {
  const sedangMengetik =
    e.target instanceof Element &&
    (e.target.matches("input, textarea, select") || e.target.isContentEditable);
  if (!sedangMengetik && e.key.toLowerCase() === "d") toggleTema();
});


/* ARTIKEL DARI API (Modul 7) + LIKE PATCH (Modul 8 · B.4) */
const containerArtikel = $(".daftar-artikel");

/* Modul 6 — simpan jumlah like per judul artikel */
function simpanLike(judulArtikel, jumlah) {
  const semuaLike = bacaJSON(KEY.like, {});
  semuaLike[judulArtikel] = jumlah;
  simpanJSON(KEY.like, semuaLike);
}

/* B.4 — PATCH jumlah like ke server (endpoint /posts/id sebagai simulasi) */
async function perbaruiLikeKeServer(postId, jumlahLike) {
  try {
    await request(`/posts/${postId}`, { method: "PATCH", body: { likes: jumlahLike } });
    console.log("Like berhasil diperbarui di server");
  } catch (error) {
    console.error("Gagal memperbarui like:", error);
  }
}

if (containerArtikel) {
  const loading = $("#loading");
  const tampilLoading = (tampil) => {
    if (loading) loading.style.display = tampil ? "block" : "none";
  };

  /* Modul 7 — GET /posts */
  async function muatArtikelDariAPI() {
    tampilLoading(true);
    try {
      const daftarPost = await (await request("/posts?_limit=5")).json();

      // Like dibaca sekali saja (bukan sekali per artikel)
      const semuaLike = bacaJSON(KEY.like, {});

      // DocumentFragment: semua artikel disusun di memori, dipasang ke DOM sekali
      const fragment = document.createDocumentFragment();
      daftarPost.forEach(({ id, title, body }) => {
        const jumlahLike = Number(semuaLike[title]) || 0;
        fragment.append(
          el(
            "article",
            { dataset: { postId: id } }, // dipakai untuk PATCH like (B.4)
            el("h3", { text: title }),
            el("p", { text: body }),
            el("button", {
              type: "button",
              text: `Like (${jumlahLike})`,
              dataset: { action: "like", like: jumlahLike },
            }),
            buatTombol("Hapus", "hapus")
          )
        );
      });
      containerArtikel.append(fragment);
    } catch (error) {
      // textContent (bukan innerHTML) lebih aman dan tidak perlu parsing HTML
      containerArtikel.replaceChildren(
        el("p", { text: "Gagal memuat artikel, silakan coba lagi nanti." })
      );
      console.error("Gagal mengambil data:", error);
    } finally {
      tampilLoading(false);
    }
  }
  muatArtikelDariAPI();

  /* Modul 4 — hover lewat event delegation (mouseover/mouseout menggelembung) */
  const aturHover = (tambah) => (e) => {
    tombolDari(e, "article")?.classList.toggle("artikel-hover", tambah);
  };
  containerArtikel.addEventListener("mouseover", aturHover(true));
  containerArtikel.addEventListener("mouseout", aturHover(false));

  /* Satu listener klik untuk Like & Hapus (sebelumnya dua listener terpisah).
     Tombol dikenali lewat data-action, bukan lewat isi teksnya. */
  containerArtikel.addEventListener("click", (e) => {
    const tombol = tombolDari(e, "button[data-action]");
    const article = tombol?.closest("article");
    if (!article) return;

    // Hapus artikel (Modul 3)
    if (tombol.dataset.action === "hapus") {
      article.remove();
      return;
    }

    // Like: tambah angka, simpan localStorage (Modul 6) + PATCH ke server (Modul 8)
    const jumlah = Number(tombol.dataset.like) + 1;
    tombol.dataset.like = jumlah;
    tombol.textContent = `Like (${jumlah})`;

    simpanLike(article.querySelector("h3").textContent, jumlah); // Modul 6
    perbaruiLikeKeServer(article.dataset.postId, jumlah);        // Modul 8
  });
}


/*  PROFIL PENULIS DARI API (Modul 7)  */
async function muatProfilPenulis() {
  const namaEl = $("#nama-penulis");
  const emailEl = $("#email-penulis");
  if (!namaEl || !emailEl) return;

  try {
    const user = await (await request("/users/1")).json();
    namaEl.textContent = user.name;
    emailEl.textContent = user.email;
  } catch (error) {
    console.error("Gagal memuat profil penulis:", error);
  }
}
muatProfilPenulis();


/*  KOMENTAR: POST, tampil id, DELETE (Modul 8)  */
const formKomentar = $("#form-komentar");
const daftarKomentar = $("#daftar-komentar");
const inputNama = $("#input-nama");
const inputPesan = $("#input-pesan");

/* Modul 6 — penyimpanan lokal agar komentar tetap tampil setelah refresh */
const ambilKomentar = () => bacaJSON(KEY.komentar, []);
const simpanKomentarArr = (arr) => simpanJSON(KEY.komentar, arr);

/* Render satu komentar + tombol hapus; dataset.id = id dari server (B.3).
   Mengembalikan elemen <li> supaya pemanggil bisa memasang banyak sekaligus. */
function buatItemKomentar({ id, nama, pesan }) {
  return el("li", { dataset: { id } }, `${nama}: ${pesan} `, buatTombol("Hapus", "hapus"));
}

/* B.2 — kirim komentar baru dengan POST */
async function kirimKomentarKeServer(nama, pesan) {
  const response = await request("/comments", {
    method: "POST",
    body: { name: nama, body: pesan, postId: 1 },
  });
  return response.json(); // server membalas data + id baru
}

if (formKomentar && daftarKomentar && inputNama && inputPesan) {
  const tombolKirim = formKomentar.querySelector('button[type="submit"]');

  // Tampilkan komentar tersimpan saat halaman dibuka (satu kali pemasangan ke DOM)
  daftarKomentar.append(...ambilKomentar().map(buatItemKomentar));

  formKomentar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = inputNama.value.trim();
    const pesan = inputPesan.value.trim();

    if (nama === "" || pesan === "") { // validasi (Modul 4-5) dipertahankan
      alert("Nama dan komentar wajib diisi!");
      return;
    }

    if (tombolKirim) tombolKirim.disabled = true; // cegah kirim ganda selama menunggu server
    try {
      const hasil = await kirimKomentarKeServer(nama, pesan);  // B.2
      const k = { id: hasil.id, nama, pesan };                 // B.3: simpan id server
      daftarKomentar.append(buatItemKomentar(k));
      simpanKomentarArr([...ambilKomentar(), k]);
      formKomentar.reset();
      console.log("Komentar tersimpan di server dengan id:", hasil.id);
    } catch (error) {
      alert("Gagal mengirim komentar, silakan coba lagi.");
      console.error(error);
    } finally {
      if (tombolKirim) tombolKirim.disabled = false;
    }
  });

  /* B.5 — hapus komentar dengan DELETE (event delegation) + pesan B.6 */
  daftarKomentar.addEventListener("click", async (e) => {
    const tombol = tombolDari(e, "button");
    const li = tombol?.closest("li");
    if (!li) return;

    const { id } = li.dataset;
    tombol.disabled = true; // cegah klik ganda selama request berjalan
    try {
      await request(`/comments/${id}`, { method: "DELETE" });
      li.remove();
      simpanKomentarArr(ambilKomentar().filter((k) => String(k.id) !== id));
    } catch (error) {
      alert(
        Number.isInteger(error.status)
          ? pesanDariStatus(error.status) // B.6: error dari server
          : "Terjadi kesalahan jaringan saat menghapus komentar."
      );
      console.error(error);
      tombol.disabled = false;
    }
  });
}


/* VALIDASI FORM (Modul 5)  */

/* Pesan validasi kustom untuk input komentar (satu fungsi untuk nama & pesan) */
function pasangPesanValidasi(input, pesanKosong, pesanPendek) {
  input?.addEventListener("input", () => {
    const { valueMissing, tooShort } = input.validity;
    input.setCustomValidity(valueMissing ? pesanKosong : tooShort ? pesanPendek : "");
  });
}
pasangPesanValidasi(inputNama, "Nama wajib diisi", "Nama minimal 3 karakter");
pasangPesanValidasi(inputPesan, "Komentar wajib diisi", "Komentar minimal 5 karakter");

/* Form pendaftaran: cek konfirmasi password (simulasi) */
const formDaftar = $("#form-daftar");
const errorKonfirmasi = $("#error-konfirmasi");

if (formDaftar && errorKonfirmasi) {
  formDaftar.addEventListener("submit", (e) => {
    e.preventDefault();
    const sama = $("#password").value === $("#konfirmasi").value;
    errorKonfirmasi.textContent = sama ? "" : "Konfirmasi password tidak sama dengan password";
    if (sama) {
      alert("Pendaftaran berhasil (simulasi)!");
      formDaftar.reset();
    }
  });
}

/* Validasi real-time: tampilkan pesan bawaan browser di elemen error masing-masing */
function validasiField(input, errorElement) {
  errorElement.textContent = input.checkValidity() ? "" : input.validationMessage;
}

[
  ["#username", "#error-username"],
  ["#email", "#error-email"],
  ["#password", "#error-password"],
].forEach(([selectorField, selectorError]) => {
  const field = $(selectorField);
  const errEl = $(selectorError);
  if (field && errEl) field.addEventListener("input", () => validasiField(field, errEl));
});


/* RESET DATA (Modul 6) */
$("#btn-reset")?.addEventListener("click", () => {
  if (!confirm("Hapus semua data tersimpan (tema, like, komentar)?")) return;

  // Hanya key milik aplikasi ini yang dihapus; localStorage.clear() akan ikut
  // menghapus data lain di origin yang sama.
  Object.values(KEY).forEach((key) => localStorage.removeItem(key));
  location.reload();
});