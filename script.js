"use strict";

const judulSitus = document.querySelector("header h1");

if (judulSitus) {
    console.log(judulSitus);
    console.log(judulSitus.textContent);
}

const tombolTema = document.querySelector("#btn-tema");

function toggleTema() {
    document.body.classList.toggle("dark-mode");
}

if (tombolTema) {
    tombolTema.addEventListener("click", toggleTema);
}

const tombolInfo = document.querySelector("#btn-info");
const kotakAside = document.querySelector("aside");

if (tombolInfo && kotakAside) {
    tombolInfo.addEventListener("click", () => {
        kotakAside.classList.toggle("tersembunyi");
        tombolInfo.setAttribute(
            "aria-expanded",
            String(!kotakAside.classList.contains("tersembunyi"))
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

const formKomentar = document.querySelector("#form-komentar");
const inputKomentar = document.querySelector("#input-komentar");
const pesanErrorKomentar = document.querySelector("#pesan-error-komentar");
const daftarKomentar = document.querySelector("#daftar-komentar");
const tombolHapusSemuaKomentar = document.querySelector("#btn-hapus-semua-komentar");

if (
    formKomentar &&
    inputKomentar instanceof HTMLTextAreaElement &&
    pesanErrorKomentar &&
    daftarKomentar &&
    tombolHapusSemuaKomentar
) {
    function perbaruiTombolHapusSemua() {
        tombolHapusSemuaKomentar.disabled = daftarKomentar.children.length === 0;
    }

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

        const itemKomentar = document.createElement("li");
        const teks = document.createElement("p");
        teks.textContent = teksKomentar;

        const tombolHapus = document.createElement("button");
        tombolHapus.type = "button";
        tombolHapus.dataset.action = "hapus-komentar";
        tombolHapus.textContent = "Hapus";
        tombolHapus.setAttribute("aria-label", "Hapus komentar");

        itemKomentar.append(teks, tombolHapus);
        daftarKomentar.appendChild(itemKomentar);
        inputKomentar.value = "";
        perbaruiTombolHapusSemua();
    });

    inputKomentar.addEventListener("input", () => {
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
            tombolHapus.closest("li")?.remove();
            perbaruiTombolHapusSemua();
        }
    });

    tombolHapusSemuaKomentar.addEventListener("click", () => {
        daftarKomentar.replaceChildren();
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
