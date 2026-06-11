/* ============================================================
   js/sheet.js
   Fetches product data from Google Apps Script JSON endpoint
   ============================================================ */

const Sheet = (() => {
  // ── Ganti dengan URL endpoint Google Apps Script kamu ──
  const API_URL = 'https://script.google.com/macros/s/AKfycbzoAG155Djwtqg2Wuy06XMZEaGDsocBVUFOgkU3y0ecRE-QpMk3koqHs9_s20E4Pwih/exec';

  /**
   * Fetch product data from the API endpoint
   * @returns {Promise<Array>} Array of product objects
   * @throws {Error} if fetch or parse fails
   */
  async function fetchProducts() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        signal: controller.signal,
        // Cache buster to always get fresh data on manual refresh
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Format data tidak valid. Harapkan array JSON.');
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Validate and normalize a single product object
   * @param {Object} item
   * @returns {Object|null} normalized product or null if invalid
   */
  function normalizeProduct(item) {
    const namaProduk = String(item.nama_produk || '').trim();
    if (!namaProduk) return null;

    const hargaBeli = Number(item.harga_beli) || 0;
    const hargaJual = Number(item.harga_jual) || 0;

    return {
      nama_produk: namaProduk,
      harga_beli:  hargaBeli,
      harga_jual:  hargaJual,
    };
  }

  /**
   * Fetch and normalize all products, sorted A-Z by name
   * @returns {Promise<Array>}
   */
  async function getProducts() {
    const raw = await fetchProducts();

    const normalized = raw
      .map(normalizeProduct)
      .filter(Boolean);

    // Sort A-Z by product name (case-insensitive)
    normalized.sort((a, b) =>
      a.nama_produk.localeCompare(b.nama_produk, 'id', { sensitivity: 'base' })
    );

    return normalized;
  }

  return { getProducts };
})();
