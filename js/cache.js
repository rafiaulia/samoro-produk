/* ============================================================
   js/cache.js
   Handles localStorage caching for product data + timestamps
   ============================================================ */

const Cache = (() => {
  const KEYS = {
    DATA:      'samoro_harg_data',
    TIMESTAMP: 'samoro_harg_ts',
  };

  /**
   * Save product data and current timestamp to localStorage
   * @param {Array} data - Array of product objects
   */
  function save(data) {
    try {
      localStorage.setItem(KEYS.DATA, JSON.stringify(data));
      localStorage.setItem(KEYS.TIMESTAMP, Date.now().toString());
    } catch (e) {
      console.warn('[Cache] Failed to save:', e);
    }
  }

  /**
   * Load cached product data
   * @returns {Array|null}
   */
  function load() {
    try {
      const raw = localStorage.getItem(KEYS.DATA);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Cache] Failed to load data:', e);
      return null;
    }
  }

  /**
   * Load cached timestamp (ms since epoch)
   * @returns {number|null}
   */
  function loadTimestamp() {
    try {
      const ts = localStorage.getItem(KEYS.TIMESTAMP);
      return ts ? parseInt(ts, 10) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Format timestamp to Indonesian locale string
   * @param {number} ms - epoch ms
   * @returns {string}
   */
  function formatTimestamp(ms) {
    if (!ms) return '–';
    const d = new Date(ms);
    return d.toLocaleString('id-ID', {
      day:    'numeric',
      month:  'long',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get formatted "last updated" string
   * @returns {string}
   */
  function getLastUpdatedLabel() {
    const ts = loadTimestamp();
    return ts ? formatTimestamp(ts) : 'Belum pernah';
  }

  /**
   * Check if cache exists
   * @returns {boolean}
   */
  function hasData() {
    return localStorage.getItem(KEYS.DATA) !== null;
  }

  /**
   * Clear all cache
   */
  function clear() {
    localStorage.removeItem(KEYS.DATA);
    localStorage.removeItem(KEYS.TIMESTAMP);
  }

  return { save, load, loadTimestamp, getLastUpdatedLabel, hasData, clear };
})();
