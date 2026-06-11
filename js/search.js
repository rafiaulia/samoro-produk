/* ============================================================
   js/search.js
   Realtime search / filter logic (case-insensitive substring)
   ============================================================ */

const Search = (() => {
  /**
   * Filter products by query string (case-insensitive substring)
   * @param {Array} products - full product list
   * @param {string} query - search query
   * @returns {Array} filtered products
   */
  function filter(products, query) {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter(p =>
      p.nama_produk.toLowerCase().includes(q)
    );
  }

  /**
   * Highlight matching text in product name (returns HTML string)
   * @param {string} name - product name
   * @param {string} query - search query
   * @returns {string} HTML with <mark> tags around matches
   */
  function highlight(name, query) {
    const q = query.trim();
    if (!q) return escapeHtml(name);

    // Escape regex special chars
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    return escapeHtml(name).replace(
      new RegExp(`(${escaped.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')})`, 'gi'),
      '<mark>$1</mark>'
    );
  }

  /**
   * Escape HTML special characters
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { filter, highlight, escapeHtml };
})();
