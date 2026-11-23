"use strict";

/* =============================================================
   MODUL 12 — COMPONENT-BASED UI (Shadow DOM, Slot, Custom Event)
   Bagian B — Kegiatan Praktikum : komponen.js
   Mata Kuliah: Pemrograman Berbasis Web (PROG31W)

   Berisi definisi custom element. Ditautkan SEBELUM script.js di
   index.html agar komponen sudah terdaftar saat script.js berjalan.

   Komponen:
     <salam-pengguna>   (dari Modul 10/11, tanpa Shadow DOM; atribut "nama" diamati)
     <kartu-artikel>    (B.2 - B.5: Shadow DOM, template, slot, gaya,
                         CustomEvent "suka" dan "hapus-artikel")
     <daftar-artikel>   (B.6: mengambil data dari API, menyusun kartu)
     <kartu-komentar>   (Pengembangan/Tugas: Shadow DOM, slot nama,
                         CustomEvent "hapus-komentar", setter "sibuk")
     <tombol-tema>      (dari Modul 10: dark mode + localStorage)

   Prinsip Modul 12:
     - Struktur dan gaya komponen TERISOLASI di dalam shadow tree.
     - Data dikirim ke komponen lewat SLOT (konten) dan ATRIBUT (nilai kecil).
     - Komponen TIDAK memutuskan apa yang terjadi setelah aksi pengguna;
       ia hanya MENGIRIM EVENT, halaman (script.js) yang menanganinya.
   ============================================================= */


/* ---------- <salam-pengguna> (dari Modul 10/11) ---------- */
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


/* ---------- B.2 - B.4 — Template <kartu-artikel> ----------
   Template dibuat SEKALI lalu di-clone untuk setiap kartu.
   <style> di dalam template hanya berlaku di dalam shadow tree.
   Custom property (var(--...)) adalah satu-satunya "pintu" gaya
   dari halaman ke dalam shadow tree.                              */
const templateKartu = document.createElement("template");
templateKartu.innerHTML = `
  <style>
    :host { display: block; }
    .kartu {
      border: 1px solid var(--kartu-garis, #ddd);
      border-radius: var(--kartu-radius, 8px);
      padding: 16px;
      background: var(--kartu-latar, transparent);
      color: var(--kartu-teks, inherit);
      transition: background-color .15s ease;
    }
    .kartu:hover { background: var(--kartu-hover, #eef4fb); }
    ::slotted(h3) { margin: 0 0 .25rem; }
    .aksi { margin-top: .5rem; }
    button {
      cursor: pointer;
      padding: .4rem .8rem;
      margin-right: .5rem;
      border: 1px solid var(--tombol-garis, #888);
      border-radius: 6px;
      background: var(--tombol-latar, #f2f2f2);
      color: var(--tombol-teks, inherit);
      font: inherit;
    }
  </style>
  <article class="kartu">
    <slot name="judul">Tanpa judul</slot>
    <slot>Tanpa isi</slot>
    <div class="aksi">
      <button type="button" class="btn-like" part="tombol-like">Like (0)</button>
      <button type="button" class="btn-hapus" part="tombol-hapus">Hapus</button>
      <slot name="aksi"></slot>
    </div>
  </article>`;


/* ---------- B.2 - B.5 — Komponen <kartu-artikel> ---------- */
class KartuArtikel extends HTMLElement {
  #like = 0;        // state jumlah like milik tiap kartu
  #tombolLike;      // referensi tombol di dalam shadow tree

  // "like": memulihkan jumlah like dari halaman.
  // "batas-like": (opsional) tombol Like dinonaktifkan setelah mencapai angka ini.
  static get observedAttributes() {
    return ["like", "batas-like"];
  }

  constructor() {
    super();
    // Shadow tree dan listener dibuat SEKALI di constructor, sehingga tidak
    // terpasang ganda ketika elemen dipindahkan (connectedCallback berulang).
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateKartu.content.cloneNode(true));

    this.#tombolLike = this.shadowRoot.querySelector(".btn-like");
    this.#tombolLike.addEventListener("click", () => {
      this.#like++;
      this.#perbaruiTombolLike();
      // B.5 — beri tahu halaman. bubbles + composed: event menembus batas shadow.
      this.dispatchEvent(new CustomEvent("suka", {
        detail: { jumlah: this.#like },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot.querySelector(".btn-hapus").addEventListener("click", () => {
      // Komponen TIDAK menghapus dirinya sendiri (beda dengan Modul 11);
      // halaman yang memutuskan lewat listener "hapus-artikel".
      this.dispatchEvent(new CustomEvent("hapus-artikel", {
        bubbles: true,
        composed: true,
      }));
    });
  }

  disconnectedCallback() {
    console.log("kartu-artikel dilepas dari halaman");
  }

  attributeChangedCallback(nama, nilaiLama, nilaiBaru) {
    if (nama === "like") {
      this.#like = Number(nilaiBaru) || 0;
    }
    this.#perbaruiTombolLike();
  }

  // Batas like valid hanya bila angka > 0; selain itu dianggap tanpa batas.
  #ambilBatas() {
    const batas = Number(this.getAttribute("batas-like"));
    return Number.isFinite(batas) && batas > 0 ? batas : null;
  }

  #perbaruiTombolLike() {
    const batas = this.#ambilBatas();
    const penuh = batas !== null && this.#like >= batas;
    this.#tombolLike.textContent = `Like (${this.#like})`;
    this.#tombolLike.disabled = penuh;
    this.#tombolLike.title = penuh ? `Batas like (${batas}) tercapai` : "";
  }
}
customElements.define("kartu-artikel", KartuArtikel);


/* ---------- B.6 — <daftar-artikel>: komponen tingkat atas ----------
   Mengambil data dari API lalu menyusun banyak <kartu-artikel>.
   Judul dan isi dikirim lewat SLOT (elemen anak di light DOM).      */
function buatKartu(post) {
  const kartu = document.createElement("kartu-artikel");
  kartu.dataset.id = post.id;

  const judul = document.createElement("h3");
  judul.slot = "judul";                 // masuk ke <slot name="judul">
  judul.textContent = post.title;       // textContent: aman dari XSS

  const isi = document.createElement("p");  // tanpa slot -> <slot> default
  isi.textContent = post.body;

  kartu.append(judul, isi);
  return kartu;
}

class DaftarArtikel extends HTMLElement {
  #sudahMuat = false;

  connectedCallback() {
    // Hindari pengambilan data ganda bila elemen dipindahkan
    if (this.#sudahMuat) return;
    this.#sudahMuat = true;
    this.muat();
  }

  async muat() {
    this.textContent = "Memuat artikel...";
    const batas = Number(this.getAttribute("batas")) || 5;

    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=${batas}`);
      if (!res.ok) throw new Error("Status: " + res.status);
      const data = await res.json();

      this.replaceChildren(...data.map(buatKartu));

      // Beri tahu halaman bahwa kartu sudah siap (mis. untuk memulihkan like)
      this.dispatchEvent(new CustomEvent("artikel-dimuat", {
        detail: { jumlah: data.length },
        bubbles: true,
      }));
    } catch (error) {
      console.error(error);
      const pesan = document.createElement("p");
      pesan.textContent = "Gagal memuat artikel, silakan coba lagi.";
      const ulang = document.createElement("button");
      ulang.type = "button";
      ulang.textContent = "Coba lagi";
      ulang.addEventListener("click", () => this.muat());
      this.replaceChildren(pesan, ulang);
    }
  }
}
customElements.define("daftar-artikel", DaftarArtikel);


/* ---------- Pengembangan — <kartu-komentar> ----------
   Slot bernama "nama" untuk nama pengirim, slot default untuk pesan.
   Tombol Hapus mengirim event "hapus-komentar"; halaman yang memanggil API. */
const templateKomentar = document.createElement("template");
templateKomentar.innerHTML = `
  <style>
    :host { display: block; }
    .komentar {
      display: flex;
      align-items: baseline;
      gap: .5rem;
      padding: .5rem .75rem;
      margin: .4rem 0;
      border-left: 4px solid var(--komentar-aksen, #2e75b6);
      background: var(--komentar-latar, #f7f7f7);
      border-radius: 0 6px 6px 0;
    }
    .teks { flex: 1; }
    ::slotted([slot="nama"]) { margin-right: .35rem; }
    button {
      cursor: pointer;
      padding: .1rem .5rem;
      border: 1px solid #d9534f;
      border-radius: 6px;
      background: transparent;
      color: #d9534f;
      font: inherit;
    }
  </style>
  <div class="komentar">
    <div class="teks">
      <slot name="nama">Anonim</slot>:
      <slot>(kosong)</slot>
    </div>
    <button type="button" class="btn-hapus">Hapus</button>
  </div>`;

class KartuKomentar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateKomentar.content.cloneNode(true));
    this.shadowRoot.querySelector(".btn-hapus").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hapus-komentar", {
        detail: { id: this.dataset.id },
        bubbles: true,
        composed: true,
      }));
    });
  }

  // Dipanggil dari luar (mis. script.js) untuk mengunci tombol saat request berjalan
  set sibuk(nilai) {
    this.shadowRoot.querySelector(".btn-hapus").disabled = Boolean(nilai);
  }
}
customElements.define("kartu-komentar", KartuKomentar);



/* ---------- <tombol-tema> (dari Modul 10) ----------
   Membungkus dark mode (class "dark-mode" di <body>) + simpan ke
   localStorage dengan key "tema" (nilai "dark" / "light"), sama dengan
   yang dipakai script.js sehingga keduanya tetap sinkron.
   Tanpa Shadow DOM: tombol berada di light DOM, jadi gaya "button" global
   dan body.dark-mode button di style.css tetap berlaku.
   Label statis agar tidak basi bila tema diubah dari shortcut "d".      */
class TombolTema extends HTMLElement {
  static #KEY = "tema";

  static get observedAttributes() {
    return ["label"];
  }

  connectedCallback() {
    this.#terapkan(this.#baca() === "dark");

    this.replaceChildren();
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = this.getAttribute("label") || "Ganti Tema";
    tombol.addEventListener("click", () => this.toggle());
    this.append(tombol);
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