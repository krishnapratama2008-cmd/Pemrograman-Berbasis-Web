const form = document.getElementById("formDaftar");
const successMessage = document.getElementById("sukses");
const fakultas = document.getElementById("fakultas");
const prodi = document.getElementById("prodi");

const prodiByFakultas = {
  "Teknik": ["Informatika", "Sistem Informasi", "Teknik Elektro", "Teknik Mesin"],
  "Ekonomi": ["Ekonomi", "Manajemen", "Akuntansi"],
  "Farmasi": ["Farmasi"],
  "Psikologi": ["Psikologi"],
  "Sastra": ["Sastra Indonesia", "Sastra Inggris", "Sejarah"],
  "Keguruan dan Ilmu Pendidikan": [
    "Bimbingan dan Konseling",
    "Pendidikan Bahasa dan Sastra Indonesia",
    "Pendidikan Bahasa Inggris pada Program Sarjana",
    "Pendidikan Biologi",
    "Pendidikan Ekonomi Bidang Keahlian Khusus Pendidikan Akuntansi",
    "Pendidikan Ekonomi Bidang Keahlian Khusus Pendidikan Ekonomi",
    "Pendidikan Fisika",
    "Pendidikan Guru Sekolah Dasar",
    "Pendidikan Keagamaan Katolik",
    "Pendidikan Kimia",
    "Pendidikan Matematika pada Program Sarjana",
    "Pendidikan Sejarah"
  ]
};

function updateProdiOptions() {
  const pilihanFakultas = fakultas.value;
  const daftarProdi = prodiByFakultas[pilihanFakultas] || [];

  prodi.innerHTML = daftarProdi.length
    ? `<option value="">-- Pilih Program Studi --</option>${daftarProdi
        .map((item) => `<option value="${item}">${item}</option>`)
        .join("")}`
    : '<option value="">-- Pilih Fakultas Terlebih Dahulu --</option>';

  if (prodi.value && !daftarProdi.includes(prodi.value)) {
    prodi.value = "";
  }
}

fakultas.addEventListener("change", () => {
  updateProdiOptions();
  const errorElement = document.getElementById("errorFakultas");
  if (errorElement) errorElement.textContent = "";
  const prodiError = document.getElementById("errorProdi");
  if (prodiError) prodiError.textContent = "";
});

const fieldConfig = [
  {
    id: "nama",
    errorId: "errorNama",
    validate: (value) => {
      if (!value.trim()) return "Nama lengkap wajib diisi.";
      if (value.trim().length < 3) return "Nama minimal 3 karakter.";
      return "";
    },
  },
  {
    id: "tempatLahir",
    errorId: "errorTempat",
    validate: (value) => {
      if (!value.trim()) return "Tempat lahir wajib diisi.";
      if (value.trim().length < 2) return "Tempat lahir minimal 2 karakter.";
      return "";
    },
  },
  {
    id: "tanggalLahir",
    errorId: "errorTanggal",
    validate: (value) => {
      if (!value) return "Tanggal lahir wajib diisi.";

      const selectedDate = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) return "Tanggal lahir tidak boleh di masa depan.";
      return "";
    },
  },
  {
    id: "jk",
    errorId: "errorJk",
    validate: (value) => {
      if (!value) return "Jenis kelamin wajib dipilih.";
      return "";
    },
  },
  {
    id: "email",
    errorId: "errorEmail",
    validate: (value) => {
      if (!value.trim()) return "Email wajib diisi.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Format email tidak valid.";
      return "";
    },
  },
  {
    id: "telepon",
    errorId: "errorTelepon",
    validate: (value) => {
      if (!value.trim()) return "Nomor telepon wajib diisi.";
      if (!/^[0-9]{10,13}$/.test(value.trim())) return "Nomor telepon harus 10-13 angka.";
      return "";
    },
  },
  {
    id: "alamat",
    errorId: "errorAlamat",
    validate: (value) => {
      if (!value.trim()) return "Alamat wajib diisi.";
      if (value.trim().length < 10) return "Alamat minimal 10 karakter.";
      return "";
    },
  },
  {
    id: "sekolah",
    errorId: "errorSekolah",
    validate: (value) => {
      if (!value.trim()) return "Asal sekolah wajib diisi.";
      if (value.trim().length < 3) return "Asal sekolah minimal 3 karakter.";
      return "";
    },
  },
  {
    id: "tahun",
    errorId: "errorTahun",
    validate: (value) => {
      if (!value) return "Tahun lulus wajib diisi.";
      const tahun = Number(value);
      if (tahun < 2000 || tahun > 2030) return "Tahun lulus harus antara 2000 dan 2030.";
      return "";
    },
  },
  {
    id: "fakultas",
    errorId: "errorFakultas",
    validate: (value) => {
      if (!value) return "Fakultas wajib dipilih.";
      return "";
    },
  },
  {
    id: "prodi",
    errorId: "errorProdi",
    validate: (value) => {
      if (!value) return "Program studi wajib dipilih.";
      return "";
    },
  },
  {
    id: "ayah",
    errorId: "errorAyah",
    validate: (value) => {
      if (!value.trim()) return "Nama ayah wajib diisi.";
      if (value.trim().length < 2) return "Nama ayah minimal 2 karakter.";
      return "";
    },
  },
  {
    id: "ibu",
    errorId: "errorIbu",
    validate: (value) => {
      if (!value.trim()) return "Nama ibu wajib diisi.";
      if (value.trim().length < 2) return "Nama ibu minimal 2 karakter.";
      return "";
    },
  },
  {
    id: "teleponOrtu",
    errorId: "errorTeleponOrtu",
    validate: (value) => {
      if (!value.trim()) return "Nomor telepon orang tua wajib diisi.";
      if (!/^[0-9]{10,13}$/.test(value.trim())) return "Nomor telepon orang tua harus 10-13 angka.";
      return "";
    },
  },
];

function setFieldState(input, errorElement, message) {
  if (!input || !errorElement) return;

  input.setCustomValidity(message);
  errorElement.textContent = message;

  const hasValue = input.value.trim() !== "";
  input.classList.toggle("invalid", Boolean(message));
  input.classList.toggle("valid", !message && hasValue);
}

function validateField(field) {
  const input = document.getElementById(field.id);
  const errorElement = document.getElementById(field.errorId);

  if (!input || !errorElement) return;

  const message = field.validate(input.value, input);
  setFieldState(input, errorElement, message);
}

fieldConfig.forEach((field) => {
  const input = document.getElementById(field.id);

  if (!input) return;

  const eventType = input.tagName === "SELECT" ? "change" : "input";
  input.addEventListener(eventType, () => validateField(field));
  input.addEventListener("blur", () => validateField(field));
});

function clearValidationState() {
  fieldConfig.forEach((field) => {
    const input = document.getElementById(field.id);
    const errorElement = document.getElementById(field.errorId);

    if (!input || !errorElement) return;

    input.setCustomValidity("");
    errorElement.textContent = "";
    input.classList.remove("invalid", "valid");
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  let isValid = true;

  fieldConfig.forEach((field) => {
    const input = document.getElementById(field.id);
    const errorElement = document.getElementById(field.errorId);

    if (!input || !errorElement) return;

    const message = field.validate(input.value, input);
    setFieldState(input, errorElement, message);

    if (message) {
      isValid = false;
    }
  });

  if (!isValid) {
    successMessage.textContent = "";
    form.reportValidity();
    return;
  }

  successMessage.textContent = "Pendaftaran mahasiswa berhasil!";
  clearValidationState();
  form.reset();
  updateProdiOptions();
});

updateProdiOptions();
clearValidationState();
