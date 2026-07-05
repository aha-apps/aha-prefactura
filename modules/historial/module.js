// module.js — Historial de Facturas
const Historial = {
  id: 'historial',
  titulo: 'Historial',
  icono: 'bi bi-clock-history',
  data: [],
  filtroFecha: '',
  filtroCliente: '',
  filtroFolio: '',
  cargando: true,

  async init() {
    console.log('💡 [historial] Inicializado');
    await this.cargarLista();
  },

  render: function() { return ''; },
  destroy: function() {},

  async cargarLista() {
    try {
      this.cargando = true;
      this.data = await db.facturas.orderBy('createdAt').reverse().toArray();
      this.cargando = false;
      var container = document.getElementById('module-container');
      if (container) container.innerHTML = this._renderHTML();
    } catch (e) {
      UI.toast('Error al cargar historial: ' + e.message, 'error');
      this.cargando = false;
    }
  },

  _getFiltradas: function() {
    var result = this.data;
    if (this.filtroFolio) {
      var q = this.filtroFolio.toLowerCase();
      result = result.filter(function(f) {
        var folioCompleto = (f.serie || 'F') + '-' + String(f.folio).padStart(3, '0');
        return folioCompleto.toLowerCase().indexOf(q) !== -1 || String(f.folio).indexOf(q) !== -1;
      });
    }
    if (this.filtroCliente) {
      var qc = this.filtroCliente.toLowerCase();
      result = result.filter(function(f) { return f.clienteNombre && f.clienteNombre.toLowerCase().indexOf(qc) !== -1; });
    }
    if (this.filtroFecha) {
      result = result.filter(function(f) {
        var fFecha = new Date(f.createdAt).toISOString().slice(0, 10);
        return fFecha === this.filtroFecha;
      }.bind(this));
    }
    return result;
  },

  _renderHTML: function() {
    var filtradas = this._getFiltradas();
    var html = '<div class="animate__animated animate__fadeInUp">';
    html += '<div class="flex flex-wrap items-center justify-between gap-4 mb-6">';
    html += '  <h2 class="text-2xl font-bold flex items-center gap-2"><i class="bi bi-clock-history text-warning"></i> Historial</h2>';
    html += '</div>';

    // Filtros
    html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">';
    html += '  <label class="form-control"><span class="label-text text-xs">Folio</span>';
    html += '    <input type="search" placeholder="Buscar por folio..." class="input input-bordered input-sm" oninput="Historial.filtroFolio=this.value;Historial._refresh()">';
    html += '  </label>';
    html += '  <label class="form-control"><span class="label-text text-xs">Cliente</span>';
    html += '    <input type="search" placeholder="Buscar por cliente..." class="input input-bordered input-sm" oninput="Historial.filtroCliente=this.value;Historial._refresh()">';
    html += '  </label>';
    html += '  <label class="form-control"><span class="label-text text-xs">Fecha</span>';
    html += '    <input type="date" class="input input-bordered input-sm" onchange="Historial.filtroFecha=this.value;Historial._refresh()">';
    html += '  </label>';
    html += '</div>';

    if (this.cargando) {
      html += '<div class="space-y-3">';
      for (var i = 0; i < 4; i++) html += '<div class="sk-el sk-row"></div>';
      html += '</div>';
      return html;
    }

    if (filtradas.length === 0) {
      html += '<div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '  <i class="bi bi-clock-history text-6xl mb-4"></i>';
      html += '  <p class="text-lg mb-4">' + (
        (this.filtroFolio || this.filtroCliente || this.filtroFecha) ? 'Sin resultados con esos filtros' : 'No hay facturas emitidas'
      ) + '</p>';
      if (!this.filtroFolio && !this.filtroCliente && !this.filtroFecha) {
        html += '  <a href="#facturas" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Crear factura</a>';
      } else {
        html += '  <button class="btn btn-ghost" onclick="Historial.filtroFolio=\'\';Historial.filtroCliente=\'\';Historial.filtroFecha=\'\';Historial._refresh()"><i class="bi bi-x"></i> Limpiar filtros</button>';
      }
      html += '</div>';
      return html;
    }

    html += '<div class="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">';
    html += '  <table class="table table-zebra">';
    html += '    <thead><tr>';
    html += '      <th>Folio</th>';
    html += '      <th>Cliente</th>';
    html += '      <th class="hidden md:table-cell">Fecha</th>';
    html += '      <th class="text-right">Subtotal</th>';
    html += '      <th class="text-right">IVA</th>';
    html += '      <th class="text-right">Total</th>';
    html += '      <th class="w-24">Acciones</th>';
    html += '    </tr></thead><tbody>';

    for (var i = 0; i < filtradas.length; i++) {
      var f = filtradas[i];
      var folioStr = UI.formatFolio(f.serie || 'F', f.folio);
      html += '<tr>';
      html += '  <td><span class="font-mono font-bold text-sm">' + folioStr + '</span></td>';
      html += '  <td>' + this._esc(f.clienteNombre || '') + '</td>';
      html += '  <td class="hidden md:table-cell text-sm text-base-content/60">' + UI.formatDate(f.createdAt) + '</td>';
      html += '  <td class="text-right font-mono text-sm">' + UI.formatCurrency(f.subtotal) + '</td>';
      html += '  <td class="text-right font-mono text-sm">' + UI.formatCurrency(f.iva) + '</td>';
      html += '  <td class="text-right font-mono font-bold">' + UI.formatCurrency(f.total) + '</td>';
      html += '  <td>';
      html += '    <div class="flex gap-1">';
      html += '      <button class="btn btn-ghost btn-sm btn-square" onclick="Facturas.verPDF(' + JSON.stringify(f).replace(/"/g, "'") + ')" title="Ver/Descargar PDF"><i class="bi bi-file-earmark-pdf text-error"></i></button>';
      html += '    </div>';
      html += '  </td>';
      html += '</tr>';
    }
    html += '    </tbody></table>';
    html += '</div>';

    // Totales
    var totalSubtotal = 0, totalIVA = 0, totalTotal = 0;
    for (var i = 0; i < filtradas.length; i++) {
      totalSubtotal += parseFloat(filtradas[i].subtotal || 0);
      totalIVA += parseFloat(filtradas[i].iva || 0);
      totalTotal += parseFloat(filtradas[i].total || 0);
    }
    html += '<div class="flex flex-wrap justify-end gap-6 mt-4 p-4 bg-base-100 rounded-xl border border-base-200">';
    html += '  <div class="text-center"><span class="text-xs text-base-content/50 block">Subtotal</span><span class="font-mono font-bold">' + UI.formatCurrency(totalSubtotal) + '</span></div>';
    html += '  <div class="text-center"><span class="text-xs text-base-content/50 block">IVA</span><span class="font-mono font-bold">' + UI.formatCurrency(totalIVA) + '</span></div>';
    html += '  <div class="text-center"><span class="text-xs text-base-content/50 block">Total</span><span class="font-mono font-bold text-primary">' + UI.formatCurrency(totalTotal) + '</span></div>';
    html += '  <div class="text-center"><span class="text-xs text-base-content/50 block">Facturas</span><span class="font-bold">' + filtradas.length + '</span></div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _refresh: function() {
    var container = document.getElementById('module-container');
    if (container) container.innerHTML = this._renderHTML();
  },

  _esc: function(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

window.MODULES = window.MODULES || {};
window.MODULES['historial'] = Historial;
console.log('📦 Módulo historial registrado');
