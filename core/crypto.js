// crypto.js — Cifrado AES (CryptoJS) + UUID v4
var cryptoHelpers = {
  _key: null,

  _getKey: function() {
    if (this._key) return this._key;
    var stored = localStorage.getItem(APP_CONFIG.cifrado.storageKey || 'aha_prefactura_key');
    if (!stored) {
      stored = CryptoJS.lib.WordArray.random(16).toString();
      localStorage.setItem(APP_CONFIG.cifrado.storageKey || 'aha_prefactura_key', stored);
    }
    this._key = stored;
    return this._key;
  },

  encrypt: function(texto) {
    if (!texto) return texto;
    try {
      return CryptoJS.AES.encrypt(texto, this._getKey()).toString();
    } catch (e) {
      console.error('Encrypt error:', e);
      return texto;
    }
  },

  decrypt: function(textoCifrado) {
    if (!textoCifrado) return textoCifrado;
    if (!textoCifrado.startsWith('U2FsdGVkX1')) return textoCifrado;
    try {
      var bytes = CryptoJS.AES.decrypt(textoCifrado, this._getKey());
      return bytes.toString(CryptoJS.enc.Utf8) || textoCifrado;
    } catch (e) {
      console.error('Decrypt error:', e);
      return textoCifrado;
    }
  },

  hash: function(texto) {
    if (!texto) return '';
    return CryptoJS.SHA256(texto).toString();
  }
};

window.uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};
