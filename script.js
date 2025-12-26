// =======================================================
// SYSTEM CORE: LOAD PAGE, HISTORY, ANIMATION, DARK MODE
// + QURAN READER SYSTEM (MUSHAF STYLE)
// =======================================================

// KONFIGURASI NAMA HALAMAN (DISESUAIKAN DENGAN FILE KAMU)
const PAGE_ALIASES = {
  // Alias untuk Menu Daftar Juz (File asli: quran-embed.html)
  'menu': 'quran-embed',       
  'daftar-juz': 'quran-embed', 
  'alquran': 'quran-embed',     
  'list': 'quran-embed',       
  'kembali': 'quran-embed',
  
  // Alias untuk Halaman Baca (File asli: baca-quran.html)
  'reader': 'baca-quran',
  'quran-embed-view': 'baca-quran',

  // Alias untuk Menu Kisah Nabi
  'nabi': 'kisah-nabi',
  'kisah': 'kisah-nabi',

  // Lainnya
  'index': 'home'
};

// Default halaman menu utama (Daftar Juz)
const MAIN_MENU_PAGE = 'quran-embed'; 

async function loadPage(page, addToHistory = true) {
  const app = document.getElementById("app");

  // 0. BERSIHKAN URL (Hapus tanda # atau parameter ?)
  page = page ? String(page).replace('#', '').split('?')[0] : 'home';
  if (!page) page = "home";

  // CEK ALIAS (SMART REDIRECT)
  if (PAGE_ALIASES[page]) {
    console.log(`[System] Redirecting alias '${page}' ke '${PAGE_ALIASES[page]}'`);
    page = PAGE_ALIASES[page];
  }

  // === PENGAMAN BARU: RESET MEMORI JUZ SAAT DI MENU ===
  if (page === 'quran-embed') {
      localStorage.removeItem("activeJuz"); 
  }

  console.log(`[System] Sedang memuat halaman: ${page}`); 

  // 1. Tampilkan loading spinner
  app.innerHTML = `
    <div class="h-[80vh] flex items-center justify-center">
        <div class="flex flex-col items-center gap-5">
          <div class="w-16 h-16 border-[6px] border-brand/30 border-t-brand rounded-full animate-spin"></div>
          <p class="text-base text-brand-dark dark:text-brand font-serif italic tracking-wider animate-pulse">Memuat Halaman...</p>
        </div>
    </div>`;

  try {
    // 2. Fetch konten halaman (Logika Pencarian File Cerdas untuk GitHub Pages)
    let response;
    
    // STRATEGI 1: Cari sesuai path persis yang diminta (misal: pages/nabi/adam.html)
    // Kita gunakan path relatif './' agar aman di GitHub Pages sub-folder
    let path1 = `./pages/${page}.html`; 
    
    try {
        response = await fetch(path1);
    } catch (err) {
        console.warn(`[System] Gagal fetch path1: ${path1}`);
    }

    // STRATEGI 2: Jika gagal, dan request mengandung 'nabi/', coba cari file flat di pages/ 
    // (Jaga-jaga kalau kamu lupa bikin folder 'nabi' dan semua file numpuk di 'pages')
    if ((!response || !response.ok) && page.includes('nabi/')) {
        let cleanName = page.split('/').pop(); // ambil 'adam' dari 'nabi/adam'
        let path2 = `./pages/${cleanName}.html`;
        console.warn(`[System] Gagal di '${path1}', mencoba fallback ke '${path2}'...`);
        response = await fetch(path2);
    }

    if (!response || !response.ok) {
      throw new Error(`Halaman '${page}' tidak ditemukan. Pastikan file ada di folder 'pages/' atau 'pages/nabi/'.`);
    }

    const html = await response.text();
    app.innerHTML = html;

    // 2.5. EKSEKUSI SCRIPT DALAM HTML
    const scripts = app.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    // 3. LOGIKA ANIMASI
    const elementsToAnimate = app.querySelectorAll(
      "h1, h2, h3, p, .group, a.inline-flex, a.flex, .relative.z-10 > span, .grid > div"
    );
    elementsToAnimate.forEach((el, index) => {
      el.classList.add("reveal-up");
      el.style.animationDelay = `${index * 50}ms`;
    });

    // 4. Scroll ke atas
    window.scrollTo(0, 0);

    // 5. HISTORY API
    if (addToHistory) {
      history.pushState({ pageId: page }, null, `#${page}`);
    }

    // 6. AUTO LOAD DATA QURAN
    if (page === "baca-quran") {
      const activeJuz = localStorage.getItem("activeJuz");
      if (activeJuz) {
        fetchJuzData(activeJuz);
      } else {
        loadPage(MAIN_MENU_PAGE);
      }
    }
  } catch (error) {
    console.error("Load Page Error:", error);
    app.innerHTML = `
      <div class="h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <div class="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
            <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Halaman Tidak Ditemukan</h2>
        <p class="text-sm text-gray-500 mb-6 max-w-md mx-auto font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">System Error: ${error.message}</p>
        
        <div class="flex gap-3">
            <button onclick="loadPage('${MAIN_MENU_PAGE}')" class="px-6 py-2 bg-brand text-white rounded-full hover:bg-brand-dark transition shadow-lg">
            Ke Menu Utama
            </button>
             <button onclick="loadPage('home')" class="px-6 py-2 border border-brand text-brand hover:bg-brand/10 rounded-full transition">
            Ke Beranda
            </button>
        </div>
      </div>`;
  }
}

// ===========================================
// FUNGSI NAVIGASI PINTAR (BACK BUTTON)
// ===========================================

function goBack() {
    let hash = location.hash.substring(1);
    let currentPage = hash.split('?')[0];

    if (currentPage === 'baca-quran') {
        loadPage(MAIN_MENU_PAGE); 
        return;
    }

    if (document.referrer.includes(window.location.host) && history.length > 1) {
        history.back();
    } else {
        loadPage(MAIN_MENU_PAGE);
    }
}

// ===========================================
// SISTEM PEMBACA AL-QURAN
// ===========================================

async function bukaJuz(nomor) {
  localStorage.setItem("activeJuz", nomor);
  await loadPage("baca-quran");
}

async function fetchJuzData(juz) {
  const container = document.getElementById("quran-container");
  const judul = document.getElementById("judul-juz");

  if (!container) return;
  if (judul) judul.innerText = `Juz ${juz}`;

  // Inject Font Arab
  if (!document.getElementById("font-quran")) {
    const link = document.createElement("link");
    link.id = "font-quran";
    link.href = "https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  try {
    container.innerHTML = `<div class="text-center py-20 animate-pulse flex flex-col items-center justify-center text-brand">
        <svg class="w-10 h-10 animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span>Sedang mengambil data Juz ${juz}...</span>
    </div>`;

    const response = await fetch(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`);
    const result = await response.json();

    if (result.code === 200) {
      let html = "";
      let currentSurah = null;

      result.data.ayahs.forEach((ayah) => {
        if (ayah.surah.number !== currentSurah) {
          if (currentSurah !== null) html += `</div></div></div>`;
          currentSurah = ayah.surah.number;

          html += `
                <div class="mb-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-brand/20 overflow-hidden reveal-up">
                    <div class="bg-brand/5 p-4 text-center border-b border-brand/10">
                        <h3 class="font-serif text-2xl font-bold text-brand-dark dark:text-brand">${ayah.surah.englishName}</h3>
                        <p class="text-xs text-gray-500 uppercase tracking-widest font-sans mt-1">
                           ${ayah.surah.name} • ${ayah.surah.numberOfAyahs} Ayat
                        </p>
                    </div>
                    <div class="p-6 md:p-10" dir="rtl">
            `;

          if (currentSurah !== 1 && currentSurah !== 9) {
            html += `
                    <div class="text-center mb-6 font-serif text-2xl md:text-3xl text-gray-800 dark:text-gray-200 opacity-80" style="font-family: 'Amiri Quran', serif;">
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                `;
          }
          html += `<div class="text-justify leading-[2.8] md:leading-[3.5] text-2xl md:text-3xl font-serif text-gray-900 dark:text-gray-100" style="font-family: 'Amiri Quran', serif;">`;
        }

        const arabicNum = ayah.numberInSurah.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
        html += `
            <span class="hover:text-brand-dark dark:hover:text-brand transition-colors duration-200 cursor-pointer relative group" title="Ayat ${ayah.numberInSurah}">
                ${ayah.text}
                <span class="inline-flex items-center justify-center w-8 h-8 mx-1 text-sm border border-brand/40 rounded-full text-brand-dark dark:text-brand bg-brand/5 align-middle select-none" style="font-family: sans-serif;">
                    ${arabicNum}
                </span>
            </span>
        `;
      });

      if (currentSurah !== null) html += `</div></div></div>`;
      container.innerHTML = html;
      
      const newElements = container.querySelectorAll(".reveal-up");
      newElements.forEach((el, idx) => el.style.animationDelay = `${idx * 100}ms`);
    } else {
      throw new Error("Gagal mengambil data dari API");
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = `
        <div class="text-center text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
            <p class="font-bold mb-2">Gagal Memuat Data</p>
            <p class="text-sm opacity-80 mb-4">Pastikan koneksi internet lancar.</p>
            <button onclick="fetchJuzData(${juz})" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Coba Lagi</button>
        </div>`;
  }
}

// ===========================================
// FITUR DASAR (THEME & NAVIGASI)
// ===========================================

const themeToggleBtn = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;

if (localStorage.getItem("theme") === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  htmlElement.classList.add("dark");
} else {
  htmlElement.classList.remove("dark");
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    htmlElement.classList.toggle("dark");
    localStorage.setItem("theme", htmlElement.classList.contains("dark") ? "dark" : "light");
  });
}

window.onpopstate = function (event) {
  if (event.state && event.state.pageId) {
    loadPage(event.state.pageId, false);
  } else {
    loadPage("home", false);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  let page = location.hash.substring(1);
  if (page) {
    loadPage(page, false);
  } else {
    loadPage("home", true);
  }
});