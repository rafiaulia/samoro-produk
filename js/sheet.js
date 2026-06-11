/* ============================================================
   js/sheet.js
   Fetches product data from Google Apps Script via JSONP
   (JSONP dipakai karena GAS tidak support CORS dari browser)
   ============================================================ */

const Sheet = (() => {
  // ── Ganti dengan URL endpoint Google Apps Script kamu ──
  const API_URL = 'https://script.google.com/macros/s/AKfycbzoAG155Djwtqg2Wuy06XMZEaGDsocBVUFOgkU3y0ecRE-QpMk3koqHs9_s20E4Pwih/exec';

  /**
   * Fetch via JSONP — satu-satunya cara bypass CORS Google Apps Script
   * @returns {Promise<Array>}
   */
  function fetchProducts() {
    return new Promise((resolve, reject) => {
      const callbackName = 'samoroCallback_' + Date.now();
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Request timeout. Cek koneksi internet.'));
      }, 15000);

      function cleanup() {
        clearTimeout(timeout);
        delete window[callbackName];
        const el = document.getElementById('jsonp-script');
        if (el) el.remove();
      }

      // Google Apps Script akan wrap JSON dengan callback name ini
      window[callbackName] = function(data) {
        cleanup();
        if (!Array.isArray(data)) {
          reject(new Error('Format data tidak valid.'));
          return;
        }
        resolve(data);
      };

      const script = document.createElement('script');
      script.id = 'jsonp-script';
      script.src = API_URL + '?callback=' + callbackName + '&t=' + Date.now();
      script.onerror = () => {
        cleanup();
        reject(new Error('Gagal menghubungi server. Cek URL endpoint.'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Normalize a single product object
   * @param {Object} item
   * @returns {Object|null}
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
   * Fetch and normalize all products, sorted A-Z
   * @returns {Promise<Array>}
   */
  async function getProducts() {
    const raw = await fetchProducts();

    const normalized = raw
      .map(normalizeProduct)
      .filter(Boolean);

    normalized.sort((a, b) =>
      a.nama_produk.localeCompare(b.nama_produk, 'id', { sensitivity: 'base' })
    );

    return normalized;
  }

  return { getProducts };
})();
