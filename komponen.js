"use strict";

/* =============================================================
   MODUL 10 — COMPONENT-BASED UI (Custom Elements)
   Bagian B — Kegiatan Praktikum : komponen.js
   Mata Kuliah: Pemrograman Berbasis Web (PROG31W)

   Ditautkan SEBELUM script.js di index.html agar komponen sudah
   terdaftar saat script.js berjalan. Tanpa Shadow DOM (Modul 12).

   Komponen:
     <salam-pengguna>  (B.2)  atribut: nama
     <kartu-artikel>   (B.3 - B.6)  atribut: judul, isi, like, batas-like, post-id
     <kartu-komentar>  (B.7)  atribut: nama, pesan, komentar-id
     <tombol-tema>     (B.7)  dark mode + localStorage

   Prinsip: komponen hanya mengurus tampilan & state-nya sendiri.
   Urusan di luar komponen (localStorage like, PATCH/DELETE ke server)
   tetap di script.js, dihubungkan lewat CustomEvent yang menggelembung.
   Semua data diisi lewat textContent (bukan innerHTML) -> aman dari XSS.
   ============================================================= */


/* ---------- B.2 — <salam-pengguna> ---------- */
class SalamPengguna extends HTMLElement {
  static get observedAttributes() {
    return ["nama"];
  }

  connectedCallback() {
    this.#tampilkan();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#tampilkan();
  }

  #tampilkan() {
    const nama = this.getAttribute("nama") || "Tamu";
    this.textContent = `Halo, ${nama}! Selamat datang di blog.`;
  }
}
customElements.define("salam-pengguna", SalamPengguna);


/* ---------- B.3 - B.6 + opsional batas-like — <kartu-artikel> ----------
   Atribut:
     judul, isi    -> teks kartu (diamati, render ulang saat berubah)
     like          -> jumlah like awal (dibaca sekali saat pertama terpasang)
     batas-like    -> (opsional) Like dinonaktifkan setelah mencapai angka ini
     post-id       -> id post dari API, ikut dikirim di event like

   Event (bubbles) yang dikirim ke luar:
     "like-berubah"  detail: { postId, judul, jumlah }
     "kartu-dihapus" detail: { postId, judul }
------------------------------------------------------------------ */
class KartuArtikel extends HTMLElement {
  #like = 0;           // state jumlah like milik tiap kartu
  #sudahInisialisasi = false;

  // B.4 — hanya atribut ini yang memicu attributeChangedCallback.
  // "like" sengaja TIDAK diamati agar state #like tidak tertimpa.
  static get observedAttributes() {
    return ["judul", "isi", "batas-like"];
  }

  connectedCallback() {
    if (!this.#sudahInisialisasi) {
      this.#like = Math.max(0, parseInt(this.getAttribute("like"), 10) || 0);
      this.#sudahInisialisasi = true;
    }
    this.render();
  }

  disconnectedCallback() {
    console.log("kartu-artikel dilepas dari halaman");
  }

  // Guard isConnected: callback bisa terpanggil sebelum elemen masuk dokumen.
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  // Batas like valid hanya bila angka > 0; selain itu dianggap tanpa batas.
  #ambilBatas() {
    const batas = Number(this.getAttribute("batas-like"));
    return Number.isFinite(batas) && batas > 0 ? batas : null;
  }

  render() {
    // Kerangka HTML TETAP (aman dari XSS); data diisi via textContent.
    this.innerHTML = `
      <article class="kartu">
        <h3></h3>
        <p></p>
        <button type="button" class="btn-like"></button>
        <button type="button" class="btn-hapus">Hapus</button>
      </article>`;

    const judul = this.getAttribute("judul") ?? "";
    this.querySelector("h3").textContent = judul;
    this.querySelector("p").textContent = this.getAttribute("isi") ?? "";

    const tombolLike = this.querySelector(".btn-like");
    const batas = this.#ambilBatas();

    const perbaruiTombol = () => {
      tombolLike.textContent = `Like (${this.#like})`;
      const penuh = batas !== null && this.#like >= batas;
      tombolLike.disabled = penuh;
      tombolLike.title = penuh ? `Batas like (${batas}) tercapai` : "";
    };
    perbaruiTombol();

    tombolLike.addEventListener("click", () => {
      this.#like++;
      perbaruiTombol();
      this.dispatchEvent(
        new CustomEvent("like-berubah", {
          bubbles: true,
          detail: {
            postId: this.getAttribute("post-id"),
            judul,
            jumlah: this.#like,
          },
        })
      );
    });

    // Tombol Hapus: kartu melepas dirinya sendiri dari dokumen
    this.querySelector(".btn-hapus").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("kartu-dihapus", {
          bubbles: true,
          detail: { postId: this.getAttribute("post-id"), judul },
        })
      );
      this.remove();
    });
  }
}
customElements.define("kartu-artikel", KartuArtikel);


/* ---------- B.7 — <kartu-komentar> ----------
   Atribut:
     nama          -> (opsional) nama penulis
     pesan         -> isi komentar
     komentar-id   -> id dari server (hasil POST), dipakai untuk DELETE

   Event "hapus-komentar" (bubbles, cancelable) detail: { id }
     - Kalau pemanggil TIDAK memanggil preventDefault(), komponen
       langsung melepas dirinya sendiri.
     - Kalau ingin DELETE ke server dulu: e.preventDefault(), kirim request,
       lalu panggil e.target.closest("kartu-komentar").remove() setelah sukses.
------------------------------------------------------------------ */
class KartuKomentar extends HTMLElement {
  static get observedAttributes() {
    return ["nama", "pesan"];
  }

  connectedCallback() {
    if (!this.hasAttribute("role")) this.setAttribute("role", "listitem");
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  // Dipanggil dari luar (mis. script.js) bila tombol perlu dikunci saat request
  set sibuk(nilai) {
    const tombol = this.querySelector(".btn-hapus");
    if (tombol) tombol.disabled = Boolean(nilai);
  }

  render() {
    this.innerHTML = `
      <p class="teks-komentar">
        <strong class="nama-komentar"></strong>
        <span class="pesan-komentar"></span>
      </p>
      <button type="button" class="btn-hapus">Hapus</button>`;

    const nama = this.getAttribute("nama") ?? "";
    const penanda = this.querySelector(".nama-komentar");
    penanda.textContent = nama ? `${nama}:` : "";
    penanda.hidden = nama === "";
    this.querySelector(".pesan-komentar").textContent = this.getAttribute("pesan") ?? "";

    this.querySelector(".btn-hapus").addEventListener("click", () => {
      const lanjut = this.dispatchEvent(
        new CustomEvent("hapus-komentar", {
          bubbles: true,
          cancelable: true,
          detail: { id: this.getAttribute("komentar-id") },
        })
      );
      if (lanjut) this.remove();
    });
  }
}
customElements.define("kartu-komentar", KartuKomentar);


/* ---------- B.7 — <tombol-tema> ----------
   Membungkus dark mode (class "dark-mode" di <body>) + simpan ke
   localStorage dengan key "tema" (sama dengan KEY.tema di script.js,
   nilai "dark" / "light"), jadi keduanya tetap sinkron.
   Label tombol sengaja statis supaya tidak basi bila tema diubah
   dari tempat lain (mis. shortcut "d" di script.js).
------------------------------------------------------------------ */
class TombolTema extends HTMLElement {
  static #KEY = "tema";

  connectedCallback() {
    this.#terapkan(this.#baca() === "dark");

    this.replaceChildren();
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = this.getAttribute("label") || "Ganti Tema";
    tombol.addEventListener("click", () => this.toggle());
    this.append(tombol);
  }

  static get observedAttributes() {
    return ["label"];
  }

  attributeChangedCallback() {
    const tombol = this.querySelector("button");
    if (tombol) tombol.textContent = this.getAttribute("label") || "Ganti Tema";
  }

  toggle() {
    const gelap = !document.body.classList.contains("dark-mode");
    this.#terapkan(gelap);
    try {
      localStorage.setItem(TombolTema.#KEY, gelap ? "dark" : "light");
    } catch (error) {
      console.error("Gagal menyimpan tema:", error);
    }
  }

  #baca() {
    try {
      return localStorage.getItem(TombolTema.#KEY);
    } catch {
      return null;
    }
  }

  #terapkan(gelap) {
    document.body.classList.toggle("dark-mode", gelap);
  }
}
customElements.define("tombol-tema", TombolTema);