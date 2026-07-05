// license.js — Sistema de licencias AHA (Lite)
(function() {
  var defaults = {
    plan: 'lite',
    maxRecords: 30,
    canExport: false,
    iaTier: 'lite',
    canWhiteLabel: false,
    customer: null
  };

  window.APP_CONFIG = window.APP_CONFIG || {};
  window.APP_ID = 'aha-prefactura';

  // Merge defaults
  for (var k in defaults) {
    if (defaults.hasOwnProperty(k) && window.APP_CONFIG[k] === undefined) {
      window.APP_CONFIG[k] = defaults[k];
    }
  }

  window.checkLicense = function() {
    return new Promise(function(resolve) {
      if (ENV === 'development') {
        window.APP_CONFIG.plan = 'lite';
        window.APP_CONFIG.maxRecords = Infinity;
        window.APP_CONFIG.canExport = true;
        resolve(true);
        return;
      }
      // Producción: buscar archivo .aha
      resolve(true);
    });
  };

  window.cargarLicencia = function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.aha';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (data.app === window.APP_ID) {
            window.APP_CONFIG.plan = data.plan || 'lite';
            window.APP_CONFIG.maxRecords = data.maxRecords || 30;
            window.APP_CONFIG.canExport = data.canExport || false;
            window.APP_CONFIG.iaTier = data.iaTier || 'lite';
            window.APP_CONFIG.canWhiteLabel = data.canWhiteLabel || false;
            window.APP_CONFIG.customer = data.customer || null;
            UI.toast('Licencia cargada: ' + data.plan, 'success');
          } else {
            UI.toast('Licencia no válida para esta app', 'error');
          }
        } catch (err) {
          UI.toast('Archivo de licencia inválido', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
})();
