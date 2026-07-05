// module.js — Clientes Fiscales
const ClientesFiscales = {
  id: 'clientes_fiscales',
  titulo: 'Clientes Fiscales',
  icono: 'bi bi-people',
  data: [],
  busqueda: '',
  cargando: true,

  async init() {
    console.log('💡 [clientes_fiscales] Inicializado');
    await this.cargarLista();
  },

  render: function() {
    return '';
  },

  destroy: function() {},

  async cargarLista() {
    try {
      this.cargando = true;
      var items = await db.clientes_fiscales.orderBy('nombre').toArray();
      // Descifrar campos
      this.data = items.map(function(item) {
        var desc = Object.assign({}, item);
        if (desc.rfc) desc.rfc = cryptoHelpers.decrypt(desc.rfc);
        if (desc.email) desc.email = cryptoHelpers.decrypt(desc.email);
        return desc;
      });
      this.cargando = false;
      var container = document.getElementById('module-container');
      if (container) container.innerHTML = this._renderHTML();
    } catch (e) {
      UI.toast('Error al cargar clientes: ' + e.message, 'error');
      this.cargando = false;
    }
  },

  _getFiltrados: function() {
    var q = (this.busqueda || '').toLowerCase();
    if (!q) return this.data;
    return this.data.filter(function(item) {
      return (item.nombre && item.nombre.toLowerCase().indexOf(q) !== -1) ||
             (item.rfc && item.rfc.toLowerCase().indexOf(q) !== -1) ||
             (item.telefono && item.telefono.indexOf(q) !== -1);
    });
  },

  _renderHTML: function() {
    var filtrados = this._getFiltrados();
    var html = '<div x-data="clientesData" x-init="initClientes()" class="animate__animated animate__fadeInUp">';

    // Título
    html += '<div class="flex flex-wrap items-center justify-between gap-4 mb-6">';
    html += '  <h2 class="text-2xl font-bold flex items-center gap-2"><i class="bi bi-people text-primary"></i> Clientes Fiscales</h2>';
    html += '</div>';

    // Toolbar
    html += '<div class="flex flex-wrap gap-3 mb-6">';
    html += '  <button class="btn btn-primary" onclick="ClientesFiscales.abrirForm(null)"><i class="bi bi-plus-lg"></i> Agregar</button>';
    html += '  <div class="join flex-1 min-w-[200px]">';
    html += '    <input type="search" id="cliente-search" placeholder="Buscar por nombre, RFC o tel\u00e9fono..." class="input input-bordered join-item w-full" oninput="ClientesFiscales.busqueda=this.value;ClientesFiscales._refresh()">';
    html += '  </div>';
    html += '</div>';

    // Loading skeleton
    if (this.cargando) {
      html += '<div class="space-y-3">';
      for (var i = 0; i < 4; i++) {
        html += '  <div class="sk-el sk-row"></div>';
      }
      html += '</div>';
      return html;
    }

    // Empty state
    if (filtrados.length === 0) {
      html += '<div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '  <i class="bi bi-people text-6xl mb-4"></i>';
      html += '  <p class="text-lg mb-4">' + (this.busqueda ? 'Sin resultados para "' + this.busqueda + '"' : 'No hay clientes registrados') + '</p>';
      html += '  <button class="btn btn-primary" onclick="ClientesFiscales.abrirForm(null)"><i class="bi bi-plus-lg"></i> Agregar primero</button>';
      html += '</div>';
      return html;
    }

    // Tabla
    html += '<div class="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">';
    html += '  <table class="table table-zebra">';
    html += '    <thead><tr>';
    html += '      <th>Nombre / Raz\u00f3n Social</th>';
    html += '      <th class="hidden md:table-cell">RFC</th>';
    html += '      <th class="hidden lg:table-cell">Tel\u00e9fono</th>';
    html += '      <th class="hidden lg:table-cell">R\u00e9gimen</th>';
    html += '      <th class="w-24">Acciones</th>';
    html += '    </tr></thead><tbody>';

    for (var i = 0; i < filtrados.length; i++) {
      var c = filtrados[i];
      html += '<tr>';
      html += '  <td><div class="font-medium">' + this._esc(c.nombre || '') + '</div><div class="text-xs text-base-content/50">' + this._esc(c.email || '') + '</div></td>';
      html += '  <td class="hidden md:table-cell font-mono text-sm">' + this._esc(c.rfc || '') + '</td>';
      html += '  <td class="hidden lg:table-cell">' + this._esc(c.telefono || '') + '</td>';
      html += '  <td class="hidden lg:table-cell"><span class="badge badge-ghost badge-sm">' + this._esc(c.regimen || '') + '</span></td>';
      html += '  <td>';
      html += '    <div class="flex gap-1">';
      html += '      <button class="btn btn-ghost btn-sm btn-square" onclick="ClientesFiscales.abrirForm(' + JSON.stringify(c).replace(/"/g, "'") + ')" title="Editar"><i class="bi bi-pencil"></i></button>';
      html += '      <button class="btn btn-ghost btn-sm btn-square text-error" onclick="ClientesFiscales.eliminar(' + JSON.stringify(c).replace(/"/g, "'") + ')" title="Eliminar"><i class="bi bi-trash"></i></button>';
      html += '    </div>';
      html += '  </td>';
      html += '</tr>';
    }

    html += '    </tbody></table>';
    html += '</div>';

    // Total
    html += '<div class="mt-3 text-sm text-base-content/40">' + filtrados.length + ' cliente' + (filtrados.length !== 1 ? 's' : '') + '</div>';

    html += '</div>';

    // Alpine data component
    html += '<script>';
    html += 'if (!window.clientesDataFn) {';
    html += '  window.clientesDataFn = true;';
    html += '  document.addEventListener("alpine:init", function() {';
    html += '    Alpine.data("clientesData", function() {';
    html += '      return {';
    html += '        initClientes: function() {}';
    html += '      };';
    html += '    });';
    html += '  });';
    html += '}';
    html += '<\/script>';

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

  abrirForm: function(item) {
    var editando = !!item;
    var nombre = item ? this._esc(item.nombre || '') : '';
    var rfc = item ? this._esc(item.rfc || '') : '';
    var regimen = item ? this._esc(item.regimen || '') : '';
    var direccion = item ? this._esc(item.direccion || '') : '';
    var email = item ? this._esc(item.email || '') : '';
    var telefono = item ? this._esc(item.telefono || '') : '';

    var html = '';
    html += '<label class="form-control w-full"><span class="label-text">Nombre / Raz\u00f3n Social <span class="text-error">*</span></span>';
    html += '<input type="text" id="f-nombre" class="input input-bordered w-full" value="' + nombre + '" required></label>';

    html += '<label class="form-control w-full"><span class="label-text">RFC <span class="text-error">*</span></span>';
    html += '<input type="text" id="f-rfc" class="input input-bordered w-full font-mono uppercase" value="' + rfc + '" placeholder="XXXX000000XXX" maxlength="13" required>';
    html += '<span class="label-text-alt text-xs text-base-content/50">Persona f\u00edsica: 13 caracteres. Persona moral: 12 caracteres.</span></label>';

    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    html += '<label class="form-control w-full"><span class="label-text">R\u00e9gimen Fiscal</span>';
    html += '<select id="f-regimen" class="select select-bordered w-full"><option value="">Seleccionar...</option>';
    html += window.seedData && window.seedData.regimenesFiscales ? window.seedData.regimenesFiscales.map(function(r) {
      return '<option value="' + r.id + ' - ' + r.nombre + '"' + (regimen.indexOf(r.id) !== -1 ? ' selected' : '') + '>' + r.id + ' - ' + r.nombre + '</option>';
    }).join('') : '';
    html += '</select></label>';

    html += '<label class="form-control w-full"><span class="label-text">Tel\u00e9fono</span>';
    html += '<input type="tel" id="f-telefono" class="input input-bordered w-full" value="' + telefono + '"></label>';
    html += '</div>';

    html += '<label class="form-control w-full"><span class="label-text">Email</span>';
    html += '<input type="email" id="f-email" class="input input-bordered w-full" value="' + email + '"></label>';

    html += '<label class="form-control w-full"><span class="label-text">Direcci\u00f3n</span>';
    html += '<textarea id="f-direccion" class="textarea textarea-bordered w-full" rows="2">' + direccion + '</textarea></label>';

    UI.modalForm(editando ? 'Editar Cliente' : 'Nuevo Cliente', html, async function(data) {
      var el = document.getElementById('f-nombre');
      if (!el || !el.value.trim()) { UI.toast('El nombre es obligatorio', 'error'); throw new Error('Validacion'); }
      var rfcEl = document.getElementById('f-rfc');
      if (!rfcEl || !rfcEl.value.trim()) { UI.toast('El RFC es obligatorio', 'error'); throw new Error('Validacion'); }
      // Validación básica RFC
      var rfcVal = rfcEl.value.trim().toUpperCase();
      if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{2,3}$/.test(rfcVal) && !/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{1,3}$/.test(rfcVal)) {
        UI.toast('El RFC no tiene un formato v\u00e1lido', 'error');
        throw new Error('Validacion');
      }

      var datos = {
        nombre: el.value.trim(),
        rfc: cryptoHelpers.encrypt(rfcVal),
        regimen: document.getElementById('f-regimen').value,
        direccion: document.getElementById('f-direccion').value.trim(),
        email: cryptoHelpers.encrypt(document.getElementById('f-email').value.trim()),
        telefono: document.getElementById('f-telefono').value.trim()
      };

      if (editando) {
        await ClientesFiscales.actualizar(item.id, datos);
      } else {
        await ClientesFiscales.guardar(datos);
      }
      await ClientesFiscales.cargarLista();
    });
  },

  async guardar(datos) {
    var registro = {
      id: uuid(),
      nombre: datos.nombre,
      rfc: datos.rfc,
      regimen: datos.regimen,
      direccion: datos.direccion,
      email: datos.email,
      telefono: datos.telefono,
      createdBy: 'anon',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.clientes_fiscales.put(registro);
    UI.toast('Cliente guardado correctamente', 'success');
  },

  async actualizar(id, datos) {
    var existente = await db.clientes_fiscales.get(id);
    if (!existente) { UI.toast('Cliente no encontrado', 'error'); return; }
    var actualizado = Object.assign({}, existente, datos, { id: id, updatedAt: new Date() });
    // Re-cifrar si viene descifrado
    if (actualizado.rfc && !actualizado.rfc.startsWith('U2FsdGVkX1')) {
      actualizado.rfc = cryptoHelpers.encrypt(actualizado.rfc);
    }
    if (actualizado.email && !actualizado.email.startsWith('U2FsdGVkX1')) {
      actualizado.email = cryptoHelpers.encrypt(actualizado.email);
    }
    await db.clientes_fiscales.put(actualizado);
    UI.toast('Cliente actualizado correctamente', 'success');
  },

  async eliminar(item) {
    var ok = await UI.confirm('\u00bfEliminar a ' + (item.nombre || 'este cliente') + '?');
    if (!ok) return;
    // Verificar si tiene facturas asociadas
    var facturas = await db.facturas.where('clienteId').equals(item.id).count();
    if (facturas > 0) {
      UI.toast('No se puede eliminar: tiene ' + facturas + ' factura(s) asociada(s)', 'error');
      return;
    }
    try {
      await db.clientes_fiscales.delete(item.id);
      UI.toast('Cliente eliminado correctamente', 'success');
      await this.cargarLista();
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  }
};

window.MODULES = window.MODULES || {};
window.MODULES['clientes_fiscales'] = ClientesFiscales;
console.log('📦 Módulo clientes_fiscales registrado');
