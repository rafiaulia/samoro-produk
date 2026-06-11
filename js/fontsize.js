/* ============================================================
   js/fontsize.js
   Ukuran teks — toggle mengambang + modal, tersimpan ke cache
   ============================================================ */

const FontSize = (() => {
  const CACHE_KEY = 'samoro_fontsize';

  // Level ukuran: index 0 = terkecil, 2 = default, 4 = terbesar
  const LEVELS = [
    { label: 'XS',  scale: 0.82, name: 'Sangat Kecil' },
    { label: 'S',   scale: 0.91, name: 'Kecil'        },
    { label: 'M',   scale: 1.00, name: 'Normal'       },  // default
    { label: 'L',   scale: 1.12, name: 'Besar'        },
    { label: 'XL',  scale: 1.26, name: 'Sangat Besar' },
  ];

  const DEFAULT_INDEX = 2; // "Normal"
  let currentIndex = DEFAULT_INDEX;

  /* ── Apply scale ke root font-size ── */
  function applyScale(index) {
    const level = LEVELS[index];
    // Ubah font-size di <html> — semua rem unit ikut scale
    document.documentElement.style.fontSize = (16 * level.scale) + 'px';
    currentIndex = index;

    // Update label di toggle button
    const btnLabel = document.getElementById('fs-toggle-label');
    if (btnLabel) btnLabel.textContent = level.label;

    // Update visual di modal
    updateModalUI(index);
  }

  /* ── Simpan ke localStorage ── */
  function save(index) {
    try {
      localStorage.setItem(CACHE_KEY, String(index));
    } catch (e) {}
  }

  /* ── Load dari localStorage ── */
  function load() {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < LEVELS.length) return idx;
      }
    } catch (e) {}
    return DEFAULT_INDEX;
  }

  /* ── Update tampilan tombol di modal ── */
  function updateModalUI(activeIndex) {
    const btns = document.querySelectorAll('.fs-level-btn');
    btns.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === activeIndex);
    });

    // Update preview text size
    const preview = document.getElementById('fs-preview-text');
    if (preview) {
      const scale = LEVELS[activeIndex].scale;
      preview.style.fontSize = (15 * scale) + 'px';
      preview.textContent = LEVELS[activeIndex].name + ' — Rp25.000';
    }

    // Update tombol + / -
    document.getElementById('fs-btn-decrease').disabled = activeIndex === 0;
    document.getElementById('fs-btn-increase').disabled = activeIndex === LEVELS.length - 1;
  }

  /* ── Buat HTML modal + toggle ── */
  function buildUI() {
    // ── Toggle button mengambang ──
    const toggle = document.createElement('button');
    toggle.id = 'fs-toggle';
    toggle.className = 'fs-toggle';
    toggle.setAttribute('aria-label', 'Ukuran teks');
    toggle.setAttribute('title', 'Atur ukuran teks');
    toggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
      </svg>
      <span id="fs-toggle-label" class="fs-toggle-label">M</span>
    `;
    document.body.appendChild(toggle);

    // ── Modal overlay ──
    const overlay = document.createElement('div');
    overlay.id = 'fs-overlay';
    overlay.className = 'fs-overlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Pengaturan ukuran teks');

    // Buat tombol level
    const levelBtns = LEVELS.map((lv, i) => `
      <button class="fs-level-btn" data-index="${i}" aria-label="Ukuran ${lv.name}">
        <span class="fs-level-label">${lv.label}</span>
        <span class="fs-level-name">${lv.name}</span>
      </button>
    `).join('');

    overlay.innerHTML = `
      <div class="fs-modal">
        <div class="fs-modal-header">
          <span class="fs-modal-title">Ukuran Teks</span>
          <button id="fs-btn-close" class="fs-btn-close" aria-label="Tutup">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="fs-preview">
          <p id="fs-preview-text" class="fs-preview-text">Normal — Rp25.000</p>
        </div>

        <div class="fs-stepper">
          <button id="fs-btn-decrease" class="fs-stepper-btn" aria-label="Perkecil">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <div class="fs-levels">${levelBtns}</div>
          <button id="fs-btn-increase" class="fs-stepper-btn" aria-label="Perbesar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <button id="fs-btn-reset" class="fs-btn-reset">Reset ke Normal</button>
      </div>
    `;
    document.body.appendChild(overlay);

    /* ── Event listeners ── */

    // Buka modal
    toggle.addEventListener('click', () => openModal());

    // Tutup modal — klik close atau overlay
    document.getElementById('fs-btn-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    // Tutup dengan Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });

    // Tombol level langsung
    overlay.querySelectorAll('.fs-level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        setLevel(idx);
      });
    });

    // Tombol + dan -
    document.getElementById('fs-btn-decrease').addEventListener('click', () => {
      if (currentIndex > 0) setLevel(currentIndex - 1);
    });
    document.getElementById('fs-btn-increase').addEventListener('click', () => {
      if (currentIndex < LEVELS.length - 1) setLevel(currentIndex + 1);
    });

    // Reset
    document.getElementById('fs-btn-reset').addEventListener('click', () => {
      setLevel(DEFAULT_INDEX);
    });
  }

  function openModal() {
    const overlay = document.getElementById('fs-overlay');
    overlay.classList.add('is-open');
    overlay.querySelector('.fs-modal').focus?.();
  }

  function closeModal() {
    document.getElementById('fs-overlay').classList.remove('is-open');
  }

  function setLevel(index) {
    applyScale(index);
    save(index);
  }

  /* ── Init ── */
  function init() {
    const saved = load();
    buildUI();
    applyScale(saved);
  }

  return { init };
})();
