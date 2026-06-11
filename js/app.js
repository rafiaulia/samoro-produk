/* ============================================================
   js/app.js
   Main application logic — wires together all modules
   ============================================================ */

(() => {
  'use strict';

  // ── DOM refs ──
  const elLoading     = document.getElementById('loading-state');
  const elEmpty       = document.getElementById('empty-state');
  const elError       = document.getElementById('error-state');
  const elErrorMsg    = document.getElementById('error-msg');
  const elList        = document.getElementById('product-list');
  const elSearch      = document.getElementById('search-input');
  const elBtnClear    = document.getElementById('btn-clear-search');
  const elBtnRefresh  = document.getElementById('btn-refresh');
  const elStatusCount = document.getElementById('status-count');
  const elStatusSync  = document.getElementById('status-sync');
  const elOffline     = document.getElementById('offline-banner');

  // ── State ──
  let allProducts = [];   // full sorted list
  let searchQuery = '';   // current search string

  // ── Format helpers ──

  /**
   * Format number as Indonesian Rupiah: Rp20.000
   * @param {number} n
   * @returns {string}
   */
  function formatRupiah(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  /**
   * Calculate profit and margin from product data
   * @param {Object} p
   * @returns {{ keuntungan: number, margin: string }}
   */
  function calcMetrics(p) {
    const keuntungan = p.harga_jual - p.harga_beli;
    const margin = p.harga_beli > 0
      ? ((keuntungan / p.harga_beli) * 100).toFixed(2)
      : '0.00';
    return { keuntungan, margin };
  }

  // ── Rendering ──

  /**
   * Render a single product card as an li element
   * @param {Object} p - product
   * @param {string} query - current search query for highlight
   * @returns {HTMLElement}
   */
  function createCard(p, query) {
    const { keuntungan, margin } = calcMetrics(p);
    const highlightedName = Search.highlight(p.nama_produk, query);

    const li = document.createElement('li');
    li.className = 'product-card';
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <div class="card-header" role="button" tabindex="0" aria-expanded="false">
        <span class="card-name">${highlightedName}</span>
        <div class="card-right">
          <span class="price-badge">${formatRupiah(p.harga_jual)}</span>
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"
            aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div class="card-detail" aria-hidden="true">
        <div class="card-detail-inner">
          <div class="detail-item">
            <span class="detail-label">Harga Beli</span>
            <span class="detail-value is-buy">${formatRupiah(p.harga_beli)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Keuntungan</span>
            <span class="detail-value is-profit">${formatRupiah(keuntungan)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Margin</span>
            <span class="detail-value is-margin">${margin}%</span>
          </div>
        </div>
      </div>
    `;

    // Expand / collapse on click & keyboard
    const header = li.querySelector('.card-header');
    const detail = li.querySelector('.card-detail');

    function toggle() {
      const isOpen = li.classList.contains('is-open');
      if (isOpen) {
        li.classList.remove('is-open');
        detail.style.maxHeight = '0';
        header.setAttribute('aria-expanded', 'false');
        detail.setAttribute('aria-hidden', 'true');
      } else {
        li.classList.add('is-open');
        detail.style.maxHeight = detail.scrollHeight + 'px';
        header.setAttribute('aria-expanded', 'true');
        detail.setAttribute('aria-hidden', 'false');
      }
    }

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    return li;
  }

  /**
   * Render list based on current allProducts + searchQuery
   */
  function renderList() {
    const filtered = Search.filter(allProducts, searchQuery);

    elList.innerHTML = '';

    if (filtered.length === 0) {
      showState('empty');
      updateStatusCount(0, allProducts.length);
      return;
    }

    // Use DocumentFragment for performance with large lists
    const fragment = document.createDocumentFragment();
    for (const p of filtered) {
      fragment.appendChild(createCard(p, searchQuery));
    }
    elList.appendChild(fragment);

    showState('list');
    updateStatusCount(filtered.length, allProducts.length);
  }

  // ── State display ──

  /**
   * Switch which state panel is visible
   * @param {'loading'|'empty'|'error'|'list'} state
   */
  function showState(state) {
    elLoading.style.display = state === 'loading' ? 'block'  : 'none';
    elEmpty.style.display   = state === 'empty'   ? 'flex'   : 'none';
    elError.style.display   = state === 'error'   ? 'flex'   : 'none';
    elList.style.display    = state === 'list'     ? 'flex'   : 'none';
  }

  /**
   * Update the product count in the status bar
   * @param {number} showing
   * @param {number} total
   */
  function updateStatusCount(showing, total) {
    if (total === 0) {
      elStatusCount.textContent = '';
      return;
    }
    if (showing === total) {
      elStatusCount.textContent = `${total} produk`;
    } else {
      elStatusCount.textContent = `${showing} dari ${total} produk`;
    }
  }

  /**
   * Update sync timestamp label
   * @param {boolean} isOnline
   */
  function updateSyncLabel(isOnline) {
    const label = Cache.getLastUpdatedLabel();
    elStatusSync.textContent = `Diperbarui: ${label}`;
    elStatusSync.className = 'status-sync' + (isOnline ? ' online' : '');
  }

  // ── Data loading ──

  /**
   * Load data: try network first, fallback to cache
   * @param {boolean} forceRefresh - if true, always hit network
   */
  async function loadData(forceRefresh = false) {
    const isOnline = navigator.onLine;

    // If not forcing and we have cache — show it fast first
    if (!forceRefresh && Cache.hasData()) {
      const cached = Cache.load();
      if (cached && cached.length > 0) {
        allProducts = cached;
        renderList();
        showState('list');
        updateSyncLabel(false);
      }
    } else {
      showState('loading');
    }

    // Attempt network fetch
    if (isOnline || forceRefresh) {
      try {
        const fresh = await Sheet.getProducts();
        Cache.save(fresh);
        allProducts = fresh;
        renderList();
        updateSyncLabel(true);
      } catch (err) {
        console.error('[App] Fetch failed:', err);

        // If we already rendered cached data — just show a soft warning
        if (allProducts.length > 0) {
          updateSyncLabel(false);
          // Don't wipe the current list
        } else {
          // Nothing cached at all — show error
          elErrorMsg.textContent = err.message || 'Periksa koneksi internet dan coba refresh.';
          showState('error');
        }
      }
    } else {
      // Fully offline
      if (allProducts.length === 0) {
        if (Cache.hasData()) {
          const cached = Cache.load();
          if (cached && cached.length > 0) {
            allProducts = cached;
            renderList();
            updateSyncLabel(false);
          } else {
            elErrorMsg.textContent = 'Tidak ada data cache. Sambungkan ke internet dan refresh.';
            showState('error');
          }
        } else {
          elErrorMsg.textContent = 'Tidak ada data cache. Sambungkan ke internet dan refresh.';
          showState('error');
        }
      }
      updateSyncLabel(false);
    }
  }

  // ── Event handlers ──

  // Search input
  elSearch.addEventListener('input', () => {
    searchQuery = elSearch.value;
    elBtnClear.style.display = searchQuery.length > 0 ? 'flex' : 'none';
    renderList();
  });

  // Clear search
  elBtnClear.addEventListener('click', () => {
    elSearch.value = '';
    searchQuery = '';
    elBtnClear.style.display = 'none';
    elSearch.focus();
    renderList();
  });

  // Refresh button
  elBtnRefresh.addEventListener('click', async () => {
    if (elBtnRefresh.disabled) return;
    elBtnRefresh.disabled = true;
    elBtnRefresh.classList.add('spinning');
    searchQuery = '';
    elSearch.value = '';
    elBtnClear.style.display = 'none';
    await loadData(true);
    elBtnRefresh.disabled = false;
    elBtnRefresh.classList.remove('spinning');
  });

  // Online / offline detection
  function handleOnline() {
    elOffline.style.display = 'none';
    loadData(false);
  }

  function handleOffline() {
    elOffline.style.display = 'flex';
    updateSyncLabel(false);
  }

  window.addEventListener('online',  handleOnline);
  window.addEventListener('offline', handleOffline);

  // Show offline banner immediately if already offline
  if (!navigator.onLine) {
    elOffline.style.display = 'flex';
  }

  // ── Service Worker registration ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  }

  // ── Init ──
  loadData(false);

})();
