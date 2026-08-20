const xss = require('xss');

/**
 * Rekurzivno čisti sve podatke od opasnog HTML/JS koda
 * @param {any} data - Podatak koji treba očistiti (string, objekat, niz)
 * @returns {any} - Očišćen podatak
 */
function sanitize(data) {
  // Ako je string, propusti ga kroz xss filter
  if (typeof data === 'string') {
    return xss(data);
  }
  // Ako je niz, očisti svaki element
  else if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }
  // Ako je objekat, očisti svako polje
  else if (typeof data === 'object' && data !== null) {
    const cleaned = {};
    for (const key in data) {
      cleaned[key] = sanitize(data[key]);
    }
    return cleaned;
  }
  // Ako je broj, boolean ili null, vrati nepromenjeno
  return data;
}

module.exports = sanitize;