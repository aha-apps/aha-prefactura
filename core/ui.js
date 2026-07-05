// ui.js — UI Helpers unificados para AHA PreFactura
window.UI = {
  toast: function(msg, tipo, duracion) {
    if (tipo === undefined) tipo = 'info';
    if (duracion === undefined) duracion = 4000;
    var iconos = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    var colores = {
      success: 'alert-success',
      error: 'alert-error',
      warning: 'alert-warning',
      info: 'alert-info'
    };
    var contenedor = document.getElementById('toast-container');
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'toast-container';
      contenedor.className = 'toast toast-top toast-end z-[100]';
      document.body.appendChild(contenedor);
    }
    var el = document.createElement('div');
    el.className = 'alert ' + (colores[tipo] || 'alert-info') + ' shadow-lg animate__animated animate__fadeInRight';
    el.innerHTML = '<div class="flex items-center gap-2"><i class="bi ' + (iconos[tipo] || iconos.info) + '"></i><span>' + msg + '</span></div>';
    contenedor.appendChild(el);
    setTimeout(function() {
      el.classList.remove('animate__fadeInRight');
      el.classList.add('animate__fadeOutRight');
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, duracion);
  },

  confirm: function(msg, titulo) {
    if (titulo === undefined) titulo = 'Confirmar';
    return new Promise(function(resolve) {
      var backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 bg-base-300/60 backdrop-blur-sm z-[70] flex items-center justify-center animate__animated animate__fadeIn';
      backdrop.innerHTML = '<div class="modal-box animate__animated animate__zoomIn">' +
        '<h3 class="font-bold text-lg flex items-center gap-2"><i class="bi bi-exclamation-triangle text-warning"></i> ' + titulo + '</h3>' +
        '<p class="py-4">' + msg + '</p>' +
        '<div class="modal-action">' +
        '<button class="btn btn-ghost" id="confirm-no">Cancelar</button>' +
        '<button class="btn btn-primary" id="confirm-yes">Aceptar</button>' +
        '</div></div>';
      document.body.appendChild(backdrop);
      document.getElementById('confirm-yes').onclick = function() { document.body.removeChild(backdrop); resolve(true); };
      document.getElementById('confirm-no').onclick = function() { document.body.removeChild(backdrop); resolve(false); };
      backdrop.addEventListener('click', function(e) { if (e.target === backdrop) { document.body.removeChild(backdrop); resolve(false); } });
    });
  },

  modalForm: function(titulo, html, onSave) {
    var backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-base-300/60 backdrop-blur-sm z-[70] flex items-start justify-center pt-[8vh] animate__animated animate__fadeIn';
    backdrop.innerHTML = '<div class="modal-box max-h-[80vh] overflow-y-auto animate__animated animate__zoomIn" style="max-width:560px">' +
      '<h3 class="font-bold text-lg mb-4 flex items-center gap-2">' + titulo + '</h3>' +
      '<form id="modal-form" class="space-y-4">' +
      html +
      '<div class="modal-action">' +
      '<button type="button" class="btn btn-ghost" id="modal-cancel">Cancelar</button>' +
      '<button type="submit" class="btn btn-primary" id="modal-save"><i class="bi bi-check-lg"></i> Guardar</button>' +
      '</div></form></div>';
    document.body.appendChild(backdrop);
    var form = document.getElementById('modal-form');
    var formData = {};
    [].forEach.call(form.querySelectorAll('[x-model]'), function(el) {
      var field = el.getAttribute('x-model').replace('form.', '');
      el.addEventListener('input', function() {
        formData[field] = el.type === 'checkbox' ? el.checked : el.value;
      });
      el.addEventListener('change', function() {
        if (el.tagName === 'SELECT') formData[field] = el.value;
      });
      formData[field] = el.type === 'checkbox' ? el.checked : el.value;
    });
    form.onsubmit = function(e) {
      e.preventDefault();
      var btn = document.getElementById('modal-save');
      btn.disabled = true;
      btn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Guardando...';
      var result = onSave(formData);
      if (result && typeof result.then === 'function') {
        result.then(function() {
          if (backdrop.parentNode) document.body.removeChild(backdrop);
        }).catch(function(err) {
          UI.toast(err.message || 'Error al guardar', 'error');
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar';
        });
      } else {
        if (backdrop.parentNode) document.body.removeChild(backdrop);
      }
    };
    document.getElementById('modal-cancel').onclick = function() {
      if (backdrop.parentNode) document.body.removeChild(backdrop);
    };
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop && backdrop.parentNode) document.body.removeChild(backdrop);
    });
  },

  loading: function(show) {
    var el = document.getElementById('app-loading');
    if (!el) {
      if (!show) return;
      el = document.createElement('div');
      el.id = 'app-loading';
      el.className = 'fixed inset-0 bg-base-100/80 z-[90] flex items-center justify-center';
      el.innerHTML = '<div class="flex flex-col items-center gap-3"><span class="loading loading-spinner loading-lg text-primary"></span><p class="text-sm text-base-content/60">Procesando...</p></div>';
      document.body.appendChild(el);
    } else {
      if (show) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    }
  },

  formatDate: function(date) {
    if (!date) return '';
    var d = new Date(date);
    if (isNaN(d.getTime())) return '';
    var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
  },

  formatCurrency: function(n) {
    if (n === undefined || n === null) return '$0.00';
    return '$' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatRelative: function(date) {
    if (!date) return '';
    var d = new Date(date);
    var ahora = new Date();
    var seg = Math.floor((ahora - d) / 1000);
    if (seg < 60) return 'hace ' + seg + 's';
    var min = Math.floor(seg / 60);
    if (min < 60) return 'hace ' + min + 'm';
    var hrs = Math.floor(min / 60);
    if (hrs < 24) return 'hace ' + hrs + 'h';
    var dias = Math.floor(hrs / 24);
    if (dias < 7) return 'hace ' + dias + 'd';
    return UI.formatDate(date);
  },

  formatFolio: function(serie, folio) {
    if (!serie) serie = 'F';
    return serie + '-' + String(folio).padStart(3, '0');
  }
};
