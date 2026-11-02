"use strict";

const judulSitus = document.querySelector("header h1");

if (judulSitus) {
    console.log(judulSitus);
    console.log(judulSitus.textContent);
}

const tombolTema = document.querySelector("#btn-tema");
const kunciPreferensiTema = "tema-gelap";

function toggleTema() {
    const temaGelap = document.body.classList.toggle("dark-mode");
    localStorage.setItem(kunciPreferensiTema, String(temaGelap));
}

document.body.classList.toggle(
    "dark-mode",
    localStorage.getItem(kunciPreferensiTema) === "true"
);

if (tombolTema) {
    tombolTema.addEventListener("click", toggleTema);
}

const tombolInfo = document.querySelector("#btn-info");
const kotakAside = document.querySelector("aside");
const kunciPreferensiAside = "aside-tersembunyi";

if (tombolInfo && kotakAside) {
    const asideTersembunyi = localStorage.getItem(kunciPreferensiAside) === "true";
    kotakAside.classList.toggle("tersembunyi", asideTersembunyi);
    tombolInfo.setAttribute("aria-expanded", String(!asideTersembunyi));

    tombolInfo.addEventListener("click", () => {
        kotakAside.classList.toggle("tersembunyi");
        const tersembunyi = kotakAside.classList.contains("tersembunyi");
        localStorage.setItem(kunciPreferensiAside, String(tersembunyi));
        tombolInfo.setAttribute(
            "aria-expanded",
            String(!tersembunyi)
        );
    });
}

const daftarPortofolio = [
    {
        id: 1,
        judul: "Proyek Rental Kendaraan",
        deskripsi: "Sistem informasi untuk mengelola rental kendaraan secara efisien.",
    },
    {
        id: 2,
        judul: "Sistem Pemesanan Makanan",
        deskripsi: "Aplikasi untuk memudahkan proses pemesanan makanan.",
    },
];

const containerPortofolio = document.querySelector(".daftar-portofolio");
const tombolTambahPortofolio = document.querySelector("#btn-tambah-portofolio");

if (containerPortofolio) {
    function renderPortofolio() {
        containerPortofolio.replaceChildren();

        daftarPortofolio.forEach((data) => {
            const article = document.createElement("article");
            article.dataset.id = String(data.id);

            const judul = document.createElement("h3");
            judul.textContent = data.judul;

            const deskripsi = document.createElement("p");
            deskripsi.textContent = data.deskripsi;

            const tombolHapus = document.createElement("button");
            tombolHapus.type = "button";
            tombolHapus.textContent = "Hapus";
            tombolHapus.setAttribute("aria-label", `Hapus ${data.judul}`);

            article.append(judul, deskripsi, tombolHapus);
            containerPortofolio.appendChild(article);
        });
    }

    renderPortofolio();

    if (tombolTambahPortofolio) {
        tombolTambahPortofolio.addEventListener("click", () => {
            const judul = window.prompt("Masukkan nama portofolio:");
            if (judul === null) {
                return;
            }

            const deskripsi = window.prompt("Masukkan deskripsi portofolio:");
            if (deskripsi === null) {
                return;
            }

            const judulBersih = judul.trim();
            const deskripsiBersih = deskripsi.trim();
            if (!judulBersih || !deskripsiBersih) {
                window.alert("Nama dan deskripsi portofolio tidak boleh kosong.");
                return;
            }

            const idBerikutnya = Math.max(0, ...daftarPortofolio.map((item) => item.id)) + 1;
            daftarPortofolio.push({
                id: idBerikutnya,
                judul: judulBersih,
                deskripsi: deskripsiBersih,
            });
            renderPortofolio();
        });
    }

    containerPortofolio.addEventListener("click", (e) => {
        if (!(e.target instanceof Element) || !e.target.closest("button")) {
            return;
        }

        const article = e.target.closest("article");
        const id = Number(article?.dataset.id);
        const index = daftarPortofolio.findIndex((item) => item.id === id);

        if (index !== -1) {
            daftarPortofolio.splice(index, 1);
            renderPortofolio();
        }
    });
}

const containerArtikel = document.querySelector(".daftar-artikel");
const statusArtikel = document.querySelector("#status-artikel-api");

function tampilkanStatusPemuatan(element, pesan) {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");

    const teks = document.createElement("span");
    teks.textContent = pesan;

    element.replaceChildren(spinner, teks);
}

function tampilkanPesanStatus(element, pesan) {
    element.textContent = pesan;
}

if (containerArtikel && statusArtikel) {
    async function muatArtikelDariAPI() {
        tampilkanStatusPemuatan(statusArtikel, "Memuat artikel...");
        containerArtikel.replaceChildren();

        try {
            const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
            if (!response.ok) {
                throw new Error(`Status HTTP: ${response.status}`);
            }

            const daftarPost = await response.json();
            if (
                !Array.isArray(daftarPost) ||
                !daftarPost.every(
                    (post) =>
                        post &&
                        typeof post.title === "string" &&
                        typeof post.body === "string"
                )
            ) {
                throw new Error("Format data artikel dari API tidak valid.");
            }

            daftarPost.forEach((post) => {
                const artikel = document.createElement("article");
                const judul = document.createElement("h3");
                const isi = document.createElement("p");

                judul.textContent = post.title;
                isi.textContent = post.body;
                artikel.append(judul, isi);
                containerArtikel.appendChild(artikel);
            });

            tampilkanPesanStatus(statusArtikel, "");
        } catch (error) {
            tampilkanPesanStatus(
                statusArtikel,
                "Artikel gagal dimuat. Periksa koneksi internet Anda, lalu muat ulang halaman."
            );
            console.error("Gagal mengambil artikel dari API:", error);
        }
    }

    muatArtikelDariAPI();
}

const formKomentar = document.querySelector("#form-komentar");
const inputKomentar = document.querySelector("#input-komentar");
const pesanErrorKomentar = document.querySelector("#pesan-error-komentar");
const daftarKomentar = document.querySelector("#daftar-komentar");
const statusKomentarAPI = document.querySelector("#status-komentar-api");
const tombolHapusSemuaKomentar = document.querySelector("#btn-hapus-semua-komentar");
const kunciKomentar = "komentar";
const kunciDraftKomentar = "draft-komentar";

if (
    formKomentar &&
    inputKomentar instanceof HTMLTextAreaElement &&
    pesanErrorKomentar &&
    daftarKomentar &&
    statusKomentarAPI &&
    tombolHapusSemuaKomentar
) {
    const komentarTersimpan = localStorage.getItem(kunciKomentar);
    let komentar = komentarTersimpan ? JSON.parse(komentarTersimpan) : [];
    let komentarAPI = [];

    if (!Array.isArray(komentar) || !komentar.every((item) => typeof item === "string")) {
        throw new Error(`Data pada localStorage "${kunciKomentar}" tidak valid.`);
    }

    function simpanKomentar() {
        localStorage.setItem(kunciKomentar, JSON.stringify(komentar));
    }

    function renderKomentar() {
        daftarKomentar.replaceChildren();

        komentarAPI.forEach((data) => {
            const itemKomentar = document.createElement("li");
            itemKomentar.className = "komentar-api";

            const nama = document.createElement("h4");
            nama.textContent = data.name;

            const email = document.createElement("small");
            email.textContent = data.email;

            const isi = document.createElement("p");
            isi.textContent = data.body;

            itemKomentar.append(nama, email, isi);
            daftarKomentar.appendChild(itemKomentar);
        });

        komentar.forEach((teksKomentar, index) => {
            const itemKomentar = document.createElement("li");
            itemKomentar.dataset.index = String(index);

            const teks = document.createElement("p");
            teks.textContent = teksKomentar;

            const tombolHapus = document.createElement("button");
            tombolHapus.type = "button";
            tombolHapus.dataset.action = "hapus-komentar";
            tombolHapus.textContent = "Hapus";
            tombolHapus.setAttribute("aria-label", "Hapus komentar");

            itemKomentar.append(teks, tombolHapus);
            daftarKomentar.appendChild(itemKomentar);
        });
    }

    async function muatKomentarDariAPI() {
        tampilkanStatusPemuatan(statusKomentarAPI, "Memuat komentar awal...");

        try {
            const response = await fetch("https://jsonplaceholder.typicode.com/posts/1/comments");
            if (!response.ok) {
                throw new Error(`Status HTTP: ${response.status}`);
            }

            const daftarKomentarAPI = await response.json();
            if (
                !Array.isArray(daftarKomentarAPI) ||
                !daftarKomentarAPI.every(
                    (item) =>
                        item &&
                        typeof item.name === "string" &&
                        typeof item.email === "string" &&
                        typeof item.body === "string"
                )
            ) {
                throw new Error("Format data komentar dari API tidak valid.");
            }

            komentarAPI = daftarKomentarAPI;
            renderKomentar();
            tampilkanPesanStatus(statusKomentarAPI, "");
        } catch (error) {
            tampilkanPesanStatus(
                statusKomentarAPI,
                "Komentar awal gagal dimuat. Periksa koneksi internet Anda, lalu muat ulang halaman."
            );
            console.error("Gagal mengambil komentar dari API:", error);
        }
    }

    function perbaruiTombolHapusSemua() {
        tombolHapusSemuaKomentar.disabled = komentar.length === 0;
    }

    const draftKomentar = sessionStorage.getItem(kunciDraftKomentar);
    if (draftKomentar !== null) {
        inputKomentar.value = draftKomentar;
    }

    renderKomentar();
    perbaruiTombolHapusSemua();
    muatKomentarDariAPI();

    formKomentar.addEventListener("submit", (e) => {
        e.preventDefault();
        const teksKomentar = inputKomentar.value.trim();

        if (teksKomentar.length < 5) {
            pesanErrorKomentar.textContent = "Komentar harus terdiri dari minimal 5 karakter.";
            inputKomentar.setAttribute("aria-invalid", "true");
            inputKomentar.focus();
            return;
        }

        pesanErrorKomentar.textContent = "";
        inputKomentar.removeAttribute("aria-invalid");

        komentar.push(teksKomentar);
        simpanKomentar();
        renderKomentar();
        inputKomentar.value = "";
        sessionStorage.removeItem(kunciDraftKomentar);
        perbaruiTombolHapusSemua();
    });

    inputKomentar.addEventListener("input", () => {
        sessionStorage.setItem(kunciDraftKomentar, inputKomentar.value);

        if (inputKomentar.value.trim().length >= 5) {
            pesanErrorKomentar.textContent = "";
            inputKomentar.removeAttribute("aria-invalid");
        }
    });

    daftarKomentar.addEventListener("click", (e) => {
        if (!(e.target instanceof Element)) {
            return;
        }

        const tombolHapus = e.target.closest('button[data-action="hapus-komentar"]');
        if (tombolHapus) {
            const itemKomentar = tombolHapus.closest("li");
            const index = Number(itemKomentar?.dataset.index);
            if (Number.isInteger(index) && index >= 0 && index < komentar.length) {
                komentar.splice(index, 1);
                simpanKomentar();
                renderKomentar();
            }
            perbaruiTombolHapusSemua();
        }
    });

    tombolHapusSemuaKomentar.addEventListener("click", () => {
        komentar = [];
        simpanKomentar();
        renderKomentar();
        perbaruiTombolHapusSemua();
    });
}

const tombolKembaliKeAtas = document.querySelector("#back-to-top");

if (tombolKembaliKeAtas) {
    function perbaruiTombolKembaliKeAtas() {
        tombolKembaliKeAtas.hidden = window.scrollY < 300;
    }

    tombolKembaliKeAtas.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", perbaruiTombolKembaliKeAtas, { passive: true });
    perbaruiTombolKembaliKeAtas();
}

const tombolReset = document.querySelector("#btn-reset");
if (tombolReset) {
  tombolReset.addEventListener("click", () => {
    const konfirmasi = confirm("Hapus semua data tersimpan (tema, like, komentar)?");
    if (konfirmasi) {
      localStorage.clear();
      sessionStorage.removeItem(kunciDraftKomentar);
      location.reload(); // tampilan kembali ke kondisi awal
    }
  });
}