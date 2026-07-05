// module.js — Facturas (multi-paso + PDF)
const Facturas = {
  id: 'facturas',
  titulo: 'Facturas',
  icono: 'bi bi-file-earmark-text',
  data: [],
  busqueda: '',
  cargando: true,
  _ultimoFolio: 0,

  async init() {
    console.log('💡 [facturas] Inicializado');
    this._ultimoFolio = parseInt(localStorage.getItem('pf_ultimo_folio') || '0', 10);
    await this.cargarLista();
  },

  render: function() { return ''; },
  destroy: function() {},

  _getSiguienteFolio: function() {
    this._ultimoFolio++;
    localStorage.setItem('pf_ultimo_folio', String(this._ultimoFolio));
    return this._ultimoFolio;
  },

  async cargarLista() {
    try {
      this.cargando = true;
      this.data = await db.facturas.orderBy('createdAt').reverse().toArray();
      this.cargando = false;
      var container = document.getElementById('module-container');
      if (container) container.innerHTML = this._renderHTML();
    } catch (e) {
      UI.toast('Error al cargar facturas: ' + e.message, 'error');
      this.cargando = false;
    }
  },

  _renderHTML: function() {
    var html = '<div class="animate__animated animate__fadeInUp">';
    html += '<div class="flex flex-wrap items-center justify-between gap-4 mb-6">';
    html += '  <h2 class="text-2xl font-bold flex items-center gap-2"><i class="bi bi-file-earmark-text text-primary"></i> Facturas</h2>';
    html += '</div>';
    html += '<div class="flex flex-wrap gap-3 mb-6">';
    html += '  <button class="btn btn-primary" onclick="Facturas.abrirWizard()"><i class="bi bi-plus-lg"></i> Nueva Factura</button>';
    html += '  <input type="search" placeholder="Buscar por folio o cliente..." class="input input-bordered flex-1 min-w-[200px]" oninput="Facturas.busqueda=this.value;Facturas._refresh()">';
    html += '</div>';

    if (this.cargando) {
      html += '<div class="space-y-3">';
      for (var i = 0; i < 4; i++) html += '<div class="sk-el sk-row"></div>';
      html += '</div>';
      return html;
    }

    var filtradas = this.data;
    var q = (this.busqueda || '').toLowerCase();
    if (q) {
      filtradas = filtradas.filter(function(f) {
        var folio = (f.folio || '').toLowerCase();
        var serie = (f.serie || 'F');
        var folioCompleto = (serie + '-' + String(f.folio).padStart(3, '0')).toLowerCase();
        return folioCompleto.indexOf(q) !== -1 || folio.indexOf(q) !== -1 || (f.clienteNombre && f.clienteNombre.toLowerCase().indexOf(q) !== -1);
      });
    }

    if (filtradas.length === 0) {
      html += '<div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '  <i class="bi bi-file-earmark-text text-6xl mb-4"></i>';
      html += '  <p class="text-lg mb-4">' + (this.busqueda ? 'Sin resultados' : 'No hay facturas emitidas') + '</p>';
      html += '  <button class="btn btn-primary" onclick="Facturas.abrirWizard()"><i class="bi bi-plus-lg"></i> Crear primera factura</button>';
      html += '</div>';
      return html;
    }

    html += '<div class="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">';
    html += '  <table class="table table-zebra">';
    html += '    <thead><tr>';
    html += '      <th>Folio</th>';
    html += '      <th>Cliente</th>';
    html += '      <th class="hidden md:table-cell">Fecha</th>';
    html += '      <th class="text-right">Total</th>';
    html += '      <th class="w-28">Acciones</th>';
    html += '    </tr></thead><tbody>';

    for (var i = 0; i < filtradas.length; i++) {
      var f = filtradas[i];
      var folioStr = UI.formatFolio(f.serie || 'F', f.folio);
      html += '<tr>';
      html += '  <td><span class="font-mono font-bold text-sm">' + folioStr + '</span></td>';
      html += '  <td>' + this._esc(f.clienteNombre || '') + '</td>';
      html += '  <td class="hidden md:table-cell text-sm text-base-content/60">' + UI.formatDate(f.createdAt) + '</td>';
      html += '  <td class="text-right font-mono font-bold">' + UI.formatCurrency(f.total) + '</td>';
      html += '  <td>';
      html += '    <div class="flex gap-1">';
      html += '      <button class="btn btn-ghost btn-sm btn-square" onclick="Facturas.verPDF(' + JSON.stringify(f).replace(/"/g, "'") + ')" title="Ver PDF"><i class="bi bi-file-earmark-pdf text-error"></i></button>';
      html += '      <button class="btn btn-ghost btn-sm btn-square" onclick="Facturas.eliminar(' + JSON.stringify(f).replace(/"/g, "'") + ')" title="Eliminar"><i class="bi bi-trash"></i></button>';
      html += '    </div>';
      html += '  </td>';
      html += '</tr>';
    }
    html += '    </tbody></table>';
    html += '</div>';
    html += '<div class="mt-3 text-sm text-base-content/40">' + filtradas.length + ' factura' + (filtradas.length !== 1 ? 's' : '') + '</div>';
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
  },

  // ─── Wizard de creación multi-paso ───

  async abrirWizard() {
    var paso = 1;
    var wizardData = {
      clienteId: null,
      clienteNombre: '',
      items: [],
      subtotal: 0,
      iva: 0,
      total: 0
    };

    var clientes = await db.clientes_fiscales.orderBy('nombre').toArray();
    var productos = await db.productos_fiscales.orderBy('clave').toArray();

    // Descifrar nombres de clientes
    clientes = clientes.map(function(c) {
      return { id: c.id, nombre: c.nombre || '', rfc: cryptoHelpers.decrypt(c.rfc || '') };
    });

    var self = this;

    function renderPaso() {
      var html = '';
      if (paso === 1) {
        // Paso 1: Seleccionar cliente
        html += '<h4 class="font-semibold mb-3 flex items-center gap-2"><span class="badge badge-primary badge-lg">1</span> Seleccionar Cliente</h4>';
        html += '<div class="space-y-2 max-h-60 overflow-y-auto">';
        if (clientes.length === 0) {
          html += '<div class="text-center py-8 text-base-content/50"><i class="bi bi-people text-4xl block mb-2"></i><p>No hay clientes registrados</p></div>';
        } else {
          for (var i = 0; i < clientes.length; i++) {
            var c = clientes[i];
            var sel = wizardData.clienteId === c.id ? 'border-primary bg-primary/5' : 'border-base-200 hover:border-base-300';
            html += '<div class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ' + sel + '" onclick="Facturas._selCliente(\'' + c.id + '\',\'' + self._esc(c.nombre) + '\')">';
            html += '  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">' + (c.nombre ? c.nombre.charAt(0).toUpperCase() : '?') + '</div>';
            html += '  <div><div class="font-medium">' + self._esc(c.nombre) + '</div><div class="text-xs text-base-content/50 font-mono">' + self._esc(c.rfc) + '</div></div>';
            if (wizardData.clienteId === c.id) html += '  <i class="bi bi-check-circle-fill text-primary ml-auto"></i>';
            html += '</div>';
          }
        }
        html += '</div>';
        html += '<p class="text-xs text-base-content/40 mt-2">Selecciona un cliente del listado.</p>';
      } else if (paso === 2) {
        // Paso 2: Agregar productos
        html += '<h4 class="font-semibold mb-3 flex items-center gap-2"><span class="badge badge-primary badge-lg">2</span> Agregar Productos</h4>';
        html += '<div class="flex gap-2 mb-3">';
        html += '  <select id="wiz-producto" class="select select-bordered flex-1">';
        html += '    <option value="">Seleccionar producto...</option>';
        for (var i = 0; i < productos.length; i++) {
          var p = productos[i];
          html += '    <option value="' + p.id + '" data-precio="' + p.precioUnitario + '" data-nombre="' + self._esc(p.nombre) + '" data-clave="' + self._esc(p.clave || '') + '" data-iva="' + p.iva + '">' + self._esc(p.clave || '') + ' - ' + self._esc(p.nombre) + ' - ' + UI.formatCurrency(p.precioUnitario) + '</option>';
        }
        html += '  </select>';
        html += '  <input type="number" id="wiz-cantidad" class="input input-bordered w-20 text-center" value="1" min="1" max="999">';
        html += '  <button class="btn btn-primary" onclick="Facturas._agregarItem()"><i class="bi bi-plus-lg"></i></button>';
        html += '</div>';

        // Items agregados
        html += '<div class="space-y-2 max-h-48 overflow-y-auto" id="wiz-items">';
        if (wizardData.items.length === 0) {
          html += '<div class="text-center py-6 text-base-content/40 text-sm">No hay productos agregados</div>';
        } else {
          for (var i = 0; i < wizardData.items.length; i++) {
            var it = wizardData.items[i];
            html += '<div class="flex items-center justify-between p-2 bg-base-200 rounded-lg">';
            html += '  <div><span class="font-medium text-sm">' + self._esc(it.nombre) + '</span><span class="text-xs text-base-content/50 ml-2">x' + it.cantidad + '</span></div>';
            html += '  <div class="flex items-center gap-2"><span class="font-mono text-sm font-bold">' + UI.formatCurrency(it.importe) + '</span>';
            html += '    <button class="btn btn-ghost btn-xs btn-square text-error" onclick="Facturas._quitarItem(' + i + ')"><i class="bi bi-x"></i></button></div>';
            html += '</div>';
          }
        }
        html += '</div>';

        // Subtotal parcial
        html += '<div class="flex justify-between mt-3 pt-3 border-t border-base-200 font-bold">';
        html += '  <span>Subtotal</span>';
        html += '  <span class="font-mono">' + UI.formatCurrency(wizardData.subtotal) + '</span>';
        html += '</div>';
      } else if (paso === 3) {
        // Paso 3: Resumen
        html += '<h4 class="font-semibold mb-3 flex items-center gap-2"><span class="badge badge-primary badge-lg">3</span> Resumen</h4>';
        var folioNuevo = self._ultimoFolio + 1;
        var folioStr = 'F-' + String(folioNuevo).padStart(3, '0');

        html += '<div class="bg-base-200 rounded-xl p-4 space-y-2">';
        html += '  <div class="flex justify-between"><span class="text-base-content/60">Folio</span><span class="font-mono font-bold">' + folioStr + '</span></div>';
        html += '  <div class="flex justify-between"><span class="text-base-content/60">Cliente</span><span>' + self._esc(wizardData.clienteNombre) + '</span></div>';
        html += '  <div class="flex justify-between"><span class="text-base-content/60">Fecha</span><span>' + UI.formatDate(new Date()) + '</span></div>';
        html += '  <hr class="border-base-300">';
        html += '  <div class="flex justify-between"><span>Subtotal</span><span class="font-mono">' + UI.formatCurrency(wizardData.subtotal) + '</span></div>';
        html += '  <div class="flex justify-between"><span>IVA (16%)</span><span class="font-mono">' + UI.formatCurrency(wizardData.iva) + '</span></div>';
        html += '  <hr class="border-base-300">';
        html += '  <div class="flex justify-between text-lg font-bold"><span>Total</span><span class="font-mono text-primary">' + UI.formatCurrency(wizardData.total) + '</span></div>';
        html += '</div>';

        html += '<div class="space-y-2 mt-4 max-h-32 overflow-y-auto">';
        html += '  <p class="text-sm font-semibold">Productos (' + wizardData.items.length + ')</p>';
        for (var i = 0; i < wizardData.items.length; i++) {
          var it = wizardData.items[i];
          html += '<div class="flex justify-between text-sm py-1 border-b border-base-200 last:border-0">';
          html += '  <span>' + self._esc(it.nombre) + ' <span class="text-base-content/40">x' + it.cantidad + '</span></span>';
          html += '  <span class="font-mono">' + UI.formatCurrency(it.importe) + '</span>';
          html += '</div>';
        }
        html += '</div>';
      }

      // Botones de navegación
      html += '<div class="modal-action flex justify-between">';
      if (paso > 1) {
        html += '  <button type="button" class="btn btn-ghost" id="wiz-prev"><i class="bi bi-arrow-left"></i> Anterior</button>';
      } else {
        html += '  <div></div>';
      }
      if (paso < 3) {
        var disabled = (paso === 1 && !wizardData.clienteId) || (paso === 2 && wizardData.items.length === 0);
        html += '  <button type="button" class="btn btn-primary"' + (disabled ? ' disabled' : '') + ' id="wiz-next">Siguiente <i class="bi bi-arrow-right"></i></button>';
      } else {
        html += '  <button type="button" class="btn btn-success" id="wiz-save"><i class="bi bi-check-lg"></i> Generar Factura y PDF</button>';
      }
      html += '</div>';

      return html;
    }

    function mostrarModal() {
      var fullHtml = renderPaso();
      var backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 bg-base-300/60 backdrop-blur-sm z-[70] flex items-start justify-center pt-[5vh] animate__animated animate__fadeIn';
      backdrop.innerHTML = '<div class="modal-box max-h-[85vh] overflow-y-auto animate__animated animate__zoomIn" style="max-width:600px">' +
        '<h3 class="font-bold text-lg mb-4 flex items-center gap-2"><i class="bi bi-file-earmark-text text-primary"></i> Nueva Factura</h3>' +
        '<form id="wiz-form" class="space-y-4">' +
        fullHtml +
        '</form></div>';
      document.body.appendChild(backdrop);

      // Step indicator
      var steps = document.querySelector('.modal-box');
      if (steps) {
        var stepHtml = '<div class="flex items-center gap-2 mb-4">';
        for (var s = 1; s <= 3; s++) {
          stepHtml += '<div class="flex items-center gap-2">';
          stepHtml += '  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ' + (s === paso ? 'bg-primary text-white' : s < paso ? 'bg-success text-white' : 'bg-base-200 text-base-content/40') + '">' + (s < paso ? '<i class="bi bi-check"></i>' : s) + '</div>';
          if (s < 3) stepHtml += '  <div class="w-8 h-0.5 ' + (s < paso ? 'bg-success' : 'bg-base-200') + '"></div>';
          stepHtml += '</div>';
        }
        stepHtml += '</div>';
        backdrop.querySelector('.modal-box h3').insertAdjacentHTML('afterend', stepHtml);
      }

      // Event handlers
      var nextBtn = document.getElementById('wiz-next');
      var prevBtn = document.getElementById('wiz-prev');
      var saveBtn = document.getElementById('wiz-save');

      if (nextBtn) {
        nextBtn.onclick = function() {
          if (paso === 1 && !wizardData.clienteId) { UI.toast('Selecciona un cliente', 'warning'); return; }
          if (paso === 2 && wizardData.items.length === 0) { UI.toast('Agrega al menos un producto', 'warning'); return; }
          paso++;
          actualizarModal();
        };
      }
      if (prevBtn) {
        prevBtn.onclick = function() {
          paso--;
          actualizarModal();
        };
      }
      if (saveBtn) {
        saveBtn.onclick = async function() {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Generando...';
          try {
            await self._guardarFactura(wizardData);
            if (backdrop.parentNode) document.body.removeChild(backdrop);
            await self.cargarLista();
          } catch (e) {
            UI.toast('Error: ' + e.message, 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Generar Factura y PDF';
          }
        };
      }

      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) {
          UI.confirm('\u00bfCancelar la creaci\u00f3n de la factura?').then(function(ok) {
            if (ok && backdrop.parentNode) document.body.removeChild(backdrop);
          });
        }
      });
    }

    function actualizarModal() {
      var form = document.getElementById('wiz-form');
      if (form) {
        var stepsContent = form.querySelector('.modal-box-steps') || form;
        form.innerHTML = renderPaso();
        // Re-insert step indicator
        var h3 = form.parentNode.querySelector('h3');
        if (h3) {
          var oldSteps = form.parentNode.querySelector('.flex.items-center.gap-2.mb-4');
          if (oldSteps) oldSteps.remove();
          var stepHtml2 = '<div class="flex items-center gap-2 mb-4">';
          for (var s = 1; s <= 3; s++) {
            stepHtml2 += '<div class="flex items-center gap-2">';
            stepHtml2 += '  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ' + (s === paso ? 'bg-primary text-white' : s < paso ? 'bg-success text-white' : 'bg-base-200 text-base-content/40') + '">' + (s < paso ? '<i class="bi bi-check"></i>' : s) + '</div>';
            if (s < 3) stepHtml2 += '  <div class="w-8 h-0.5 ' + (s < paso ? 'bg-success' : 'bg-base-200') + '"></div>';
            stepHtml2 += '</div>';
          }
          stepHtml2 += '</div>';
          h3.insertAdjacentHTML('afterend', stepHtml2);
        }

        // Re-bind buttons
        var n2 = document.getElementById('wiz-next');
        var p2 = document.getElementById('wiz-prev');
        var s2 = document.getElementById('wiz-save');
        if (n2) n2.onclick = function() { if (paso === 1 && !wizardData.clienteId) { UI.toast('Selecciona un cliente', 'warning'); return; } if (paso === 2 && wizardData.items.length === 0) { UI.toast('Agrega al menos un producto', 'warning'); return; } paso++; actualizarModal(); };
        if (p2) p2.onclick = function() { paso--; actualizarModal(); };
        if (s2) s2.onclick = async function() {
          s2.disabled = true;
          s2.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Generando...';
          try {
            await self._guardarFactura(wizardData);
            var bd = document.querySelector('.fixed.inset-0.bg-base-300\\/60');
            if (bd && bd.parentNode) document.body.removeChild(bd);
            await self.cargarLista();
          } catch (e) {
            UI.toast('Error: ' + e.message, 'error');
            s2.disabled = false;
            s2.innerHTML = '<i class="bi bi-check-lg"></i> Generar Factura y PDF';
          }
        };
      }
    }

    mostrarModal();
  },

  _selCliente: function(id, nombre) {
    var wd = this._getWizardData();
    if (wd) {
      wd.clienteId = id;
      wd.clienteNombre = nombre;
      // Refresh the current paso view
      var next = document.getElementById('wiz-next');
      if (next) {
        var dis = document.querySelector('[onclick*="Facturas._selCliente"]');
        // Re-render paso
        var form = document.getElementById('wiz-form');
        if (form) {
          var paso = 1;
          // Simple re-render trick
          UI.toast('Cliente seleccionado: ' + nombre, 'success');
          // Re-enable next
          next.disabled = false;
        }
      }
    }
  },

  _getWizardData: function() {
    // Access wd via closure - stored in the module
    return this._wd;
  },

  _agregarItem: function() {
    var sel = document.getElementById('wiz-producto');
    var cant = document.getElementById('wiz-cantidad');
    if (!sel || !sel.value) { UI.toast('Selecciona un producto', 'warning'); return; }
    var option = sel.options[sel.selectedIndex];
    var cantidad = parseInt(cant ? cant.value : '1', 10) || 1;
    var precio = parseFloat(option.dataset.precio) || 0;
    var importe = cantidad * precio;
    var ivaAplica = option.dataset.iva === 'S\u00ed';

    // Store in a temp var for the wizard
    if (!this._wizardItems) this._wizardItems = [];
    this._wizardItems.push({
      productoId: sel.value,
      clave: option.dataset.clave || '',
      nombre: option.dataset.nombre || '',
      cantidad: cantidad,
      precioUnitario: precio,
      importe: importe,
      ivaAplica: ivaAplica
    });
    this._recalcularWizard();
    UI.toast('Producto agregado', 'success');
    // Refresh paso 2
    var next2 = document.getElementById('wiz-next');
    if (next2) {
      var wizItems = document.getElementById('wiz-items');
      if (wizItems) {
        var self = this;
        var html = '';
        var items = this._wizardItems;
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          html += '<div class="flex items-center justify-between p-2 bg-base-200 rounded-lg">';
          html += '  <div><span class="font-medium text-sm">' + self._esc(it.nombre) + '</span><span class="text-xs text-base-content/50 ml-2">x' + it.cantidad + '</span></div>';
          html += '  <div class="flex items-center gap-2"><span class="font-mono text-sm font-bold">' + UI.formatCurrency(it.importe) + '</span>';
          html += '    <button class="btn btn-ghost btn-xs btn-square text-error" onclick="Facturas._quitarItem(' + i + ')"><i class="bi bi-x"></i></button></div>';
          html += '</div>';
        }
        wizItems.innerHTML = html;
        next2.disabled = false;
      }
    }
  },

  _quitarItem: function(idx) {
    if (this._wizardItems) {
      this._wizardItems.splice(idx, 1);
      this._recalcularWizard();
      // Refresh items display
      var wizItems = document.getElementById('wiz-items');
      if (wizItems) {
        var self = this;
        var html = '';
        var items = this._wizardItems;
        if (items.length === 0) {
          html = '<div class="text-center py-6 text-base-content/40 text-sm">No hay productos agregados</div>';
        } else {
          for (var i = 0; i < items.length; i++) {
            var it = items[i];
            html += '<div class="flex items-center justify-between p-2 bg-base-200 rounded-lg">';
            html += '  <div><span class="font-medium text-sm">' + self._esc(it.nombre) + '</span><span class="text-xs text-base-content/50 ml-2">x' + it.cantidad + '</span></div>';
            html += '  <div class="flex items-center gap-2"><span class="font-mono text-sm font-bold">' + UI.formatCurrency(it.importe) + '</span>';
            html += '    <button class="btn btn-ghost btn-xs btn-square text-error" onclick="Facturas._quitarItem(' + i + ')"><i class="bi bi-x"></i></button></div>';
            html += '</div>';
          }
        }
        wizItems.innerHTML = html;
      }
    }
    UI.toast('Producto eliminado', 'info');
  },

  _recalcularWizard: function() {
    if (!this._wizardItems) return;
    var subtotal = 0;
    var ivaTotal = 0;
    for (var i = 0; i < this._wizardItems.length; i++) {
      var it = this._wizardItems[i];
      subtotal += it.importe;
      if (it.ivaAplica) {
        ivaTotal += it.importe * 0.16;
      }
    }
    // Store in the wizard data accessible from the modal
    this._wizardSubtotal = subtotal;
    this._wizardIva = ivaTotal;
    this._wizardTotal = subtotal + ivaTotal;

    // Update the display in the modal
    var subEl = document.querySelector('.flex.justify-between.border-t');
    if (subEl) {
      subEl.innerHTML = '<span>Subtotal</span><span class="font-mono">' + UI.formatCurrency(subtotal) + '</span>';
    }
  },

  async _guardarFactura(wizardData) {
    var items = this._wizardItems || [];
    if (!wizardData.clienteId) throw new Error('No hay cliente seleccionado');
    if (items.length === 0) throw new Error('No hay productos');

    var folio = this._getSiguienteFolio();
    var subtotal = 0;
    var ivaTotal = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      subtotal += it.importe;
      if (it.ivaAplica) ivaTotal += it.importe * 0.16;
    }
    var total = subtotal + ivaTotal;

    var facturaId = uuid();
    var factura = {
      id: facturaId,
      folio: folio,
      serie: 'F',
      clienteId: wizardData.clienteId,
      clienteNombre: wizardData.clienteNombre,
      subtotal: subtotal,
      iva: ivaTotal,
      total: total,
      createdBy: 'anon',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.facturas.put(factura);

    // Guardar items
    var itemsParaDB = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      itemsParaDB.push({
        id: uuid(),
        facturaId: facturaId,
        productoId: it.productoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        importe: it.importe
      });
    }
    if (itemsParaDB.length > 0) {
      await db.facturas_items.bulkAdd(itemsParaDB);
    }

    // Generar PDF
    await this._generarPDF(factura, itemsParaDB);

    // Limpiar wizard
    this._wizardItems = [];
    this._wizardSubtotal = 0;
    this._wizardIva = 0;
    this._wizardTotal = 0;

    UI.toast('Factura ' + UI.formatFolio('F', folio) + ' generada exitosamente', 'success');
  },

  async _generarPDF(factura, items) {
    var clientes = await db.clientes_fiscales.get(factura.clienteId);
    var clienteNombre = factura.clienteNombre || (clientes ? clientes.nombre : '');
    var clienteRFC = clientes ? cryptoHelpers.decrypt(clientes.rfc || '') : '';
    var clienteDireccion = clientes ? (clientes.direccion || '') : '';
    var clienteRegimen = clientes ? (clientes.regimen || '') : '';

    var { jsPDF } = window.jspdf;
    var doc = new jsPDF({ unit: 'mm', format: 'letter' });
    var pageW = 216; // letter width in mm
    var margin = 20;
    var y = margin;

    // Colores
    var cyan = [8, 145, 178];
    var gray = [100, 116, 139];

    // Encabezado
    doc.setFillColor(cyan[0], cyan[1], cyan[2]);
    doc.rect(0, 0, pageW, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AHA PreFactura', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Factura electr\u00f3nica - Prefacturaci\u00f3n offline', margin, 26);
    doc.text('Folio: ' + UI.formatFolio(factura.serie || 'F', factura.folio), pageW - margin, 18, { align: 'right' });

    y = 45;

    // Datos del cliente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Cliente', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Cliente: ' + clienteNombre, margin, y); y += 6;
    doc.text('RFC: ' + clienteRFC, margin, y); y += 6;
    if (clienteDireccion) { doc.text('Direcci\u00f3n: ' + clienteDireccion, margin, y); y += 6; }
    if (clienteRegimen) { doc.text('R\u00e9gimen: ' + clienteRegimen, margin, y); y += 6; }

    y += 4;

    // Fecha
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de emisi\u00f3n:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(UI.formatDate(factura.createdAt), margin + 40, y);
    y += 8;

    // Tabla de conceptos
    doc.setFillColor(cyan[0], cyan[1], cyan[2]);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
    doc.text('Cant.', margin + 3, y + 5);
    doc.text('Concepto', margin + 20, y + 5);
    doc.text('P. Unitario', pageW / 2 + 10, y + 5);
    doc.text('Importe', pageW - margin - 30, y + 5);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Obtener nombres de productos
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var prod = await db.productos_fiscales.get(it.productoId);
      var nombreProd = prod ? prod.nombre : 'Producto';

      doc.text(String(it.cantidad), margin + 3, y);
      doc.text(nombreProd, margin + 20, y);
      doc.text('$' + it.precioUnitario.toFixed(2), pageW / 2 + 10, y);
      doc.text('$' + it.importe.toFixed(2), pageW - margin - 30, y);
      y += 6;
    }

    // Totales
    y += 4;
    var totalX = pageW - margin - 50;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', totalX, y);
    doc.text('$' + factura.subtotal.toFixed(2), pageW - margin, y, { align: 'right' });
    y += 6;
    doc.text('IVA (16%):', totalX, y);
    doc.text('$' + factura.iva.toFixed(2), pageW - margin, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(cyan[0], cyan[1], cyan[2]);
    doc.line(totalX, y, pageW - margin, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(cyan[0], cyan[1], cyan[2]);
    doc.text('Total:', totalX, y);
    doc.text('$' + factura.total.toFixed(2), pageW - margin, y, { align: 'right' });

    // Footer
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generado con AHA PreFactura - Prefacturaci\u00f3n offline', pageW / 2, 275, { align: 'center' });
    doc.text('Folio: ' + UI.formatFolio(factura.serie || 'F', factura.folio) + ' | Fecha: ' + UI.formatDate(factura.createdAt), pageW / 2, 280, { align: 'center' });

    // Descargar PDF
    var nombreArchivo = 'Factura-' + UI.formatFolio(factura.serie || 'F', factura.folio) + '.pdf';
    doc.save(nombreArchivo);
  },

  async verPDF(factura) {
    var items = await db.facturas_items.where('facturaId').equals(factura.id).toArray();
    await this._generarPDF(factura, items);
  },

  async eliminar(item) {
    var ok = await UI.confirm('\u00bfEliminar factura ' + UI.formatFolio(item.serie || 'F', item.folio) + '?');
    if (!ok) return;
    try {
      await db.facturas_items.where('facturaId').equals(item.id).delete();
      await db.facturas.delete(item.id);
      UI.toast('Factura eliminada correctamente', 'success');
      await this.cargarLista();
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  }
};

window.MODULES = window.MODULES || {};
window.MODULES['facturas'] = Facturas;
console.log('📦 Módulo facturas registrado');
