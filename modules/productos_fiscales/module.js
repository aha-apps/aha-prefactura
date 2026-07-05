// module.js — Productos Fiscales
const ProductosFiscales = {
  id: 'productos_fiscales',
  titulo: 'Productos Fiscales',
  icono: 'bi bi-box-seam',
  data: [],
  busqueda: '',
  cargando: true,

  async init() {
    console.log('💡 [productos_fiscales] Inicializado');
    await this.cargarLista();
  },

  render: function() { return ''; },
  destroy: function() {},

  async cargarLista() {
    try {
      this.cargando = true;
      this.data = await db.productos_fiscales.orderBy('clave').toArray();
      this.cargando = false;
      var container = document.getElementById('module-container');
      if (container) container.innerHTML = this._renderHTML();
    } catch (e) {
      UI.toast('Error al cargar productos: ' + e.message, 'error');
      this.cargando = false;
    }
  },

  _getFiltrados: function() {
    var q = (this.busqueda || '').toLowerCase();
    if (!q) return this.data;
    return this.data.filter(function(item) {
      return (item.clave && item.clave.toLowerCase().indexOf(q) !== -1) ||
             (item.nombre && item.nombre.toLowerCase().indexOf(q) !== -1) ||
             (item.categoria && item.categoria.toLowerCase().indexOf(q) !== -1);
    });
  },

  _renderHTML: function() {
    var filtrados = this._getFiltrados();
    var html = '<div class="animate__animated animate__fadeInUp">';

    html += '<div class="flex flex-wrap items-center justify-between gap-4 mb-6">';
    html += '  <h2 class="text-2xl font-bold flex items-center gap-2"><i class="bi bi-box-seam text-secondary"></i> Productos Fiscales</h2>';
    html += '</div>';

    html += '<div class="flex flex-wrap gap-3 mb-6">';
    html += '  <button class="btn btn-primary" onclick="ProductosFiscales.abrirForm(null)"><i class="bi bi-plus-lg"></i> Agregar</button>';
    html += '  <input type="search" placeholder="Buscar por clave, nombre o categor\u00eda..." class="input input-bordered flex-1 min-w-[200px]" oninput="ProductosFiscales.busqueda=this.value;ProductosFiscales._refresh()">';
    html += '</div>';

    if (this.cargando) {
      html += '<div class="space-y-3">';
      for (var i = 0; i < 4; i++) html += '  <div class="sk-el sk-row"></div>';
      html += '</div>';
      return html;
    }

    if (filtrados.length === 0) {
      html += '<div class="flex flex-col items-center justify-center py-16 text-base-content/50">';
      html += '  <i class="bi bi-box-seam text-6xl mb-4"></i>';
      html += '  <p class="text-lg mb-4">' + (this.busqueda ? 'Sin resultados para "' + this.busqueda + '"' : 'No hay productos registrados') + '</p>';
      html += '  <button class="btn btn-primary" onclick="ProductosFiscales.abrirForm(null)"><i class="bi bi-plus-lg"></i> Agregar primero</button>';
      html += '</div>';
      return html;
    }

    html += '<div class="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-200">';
    html += '  <table class="table table-zebra">';
    html += '    <thead><tr>';
    html += '      <th>Clave</th>';
    html += '      <th>Nombre</th>';
    html += '      <th class="hidden md:table-cell">Categor\u00eda</th>';
    html += '      <th class="text-right">Precio</th>';
    html += '      <th class="text-center">IVA</th>';
    html += '      <th class="w-24">Acciones</th>';
    html += '    </tr></thead><tbody>';

    for (var i = 0; i < filtrados.length; i++) {
      var p = filtrados[i];
      html += '<tr>';
      html += '  <td><span class="font-mono text-sm badge badge-ghost">' + this._esc(p.clave || '') + '</span></td>';
      html += '  <td class="font-medium">' + this._esc(p.nombre || '') + '</td>';
      html += '  <td class="hidden md:table-cell text-sm text-base-content/60">' + this._esc(p.categoria || '') + '</td>';
      html += '  <td class="text-right font-mono font-bold">' + UI.formatCurrency(p.precioUnitario) + '</td>';
      html += '  <td class="text-center">';
      html += p.iva === 'S\u00ed' ? '<span class="badge badge-success badge-sm">S\u00ed</span>' : '<span class="badge badge-ghost badge-sm">No</span>';
      html += '  </td>';
      html += '  <td>';
      html += '    <div class="flex gap-1">';
      html += '      <button class="btn btn-ghost btn-sm btn-square" onclick="ProductosFiscales.abrirForm(' + JSON.stringify(p).replace(/"/g, "'") + ')" title="Editar"><i class="bi bi-pencil"></i></button>';
      html += '      <button class="btn btn-ghost btn-sm btn-square text-error" onclick="ProductosFiscales.eliminar(' + JSON.stringify(p).replace(/"/g, "'") + ')" title="Eliminar"><i class="bi bi-trash"></i></button>';
      html += '    </div>';
      html += '  </td>';
      html += '</tr>';
    }
    html += '    </tbody></table>';
    html += '</div>';
    html += '<div class="mt-3 text-sm text-base-content/40">' + filtrados.length + ' producto' + (filtrados.length !== 1 ? 's' : '') + '</div>';
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

  abrirForm: function(item) {
    var editando = !!item;
    var clave = item ? this._esc(item.clave || '') : '';
    var nombre = item ? this._esc(item.nombre || '') : '';
    var precio = item ? (item.precioUnitario || '') : '';
    var iva = item ? (item.iva || 'S\u00ed') : 'S\u00ed';
    var categoria = item ? this._esc(item.categoria || '') : '';

    var html = '';
    html += '<label class="form-control w-full"><span class="label-text">Clave <span class="text-error">*</span></span>';
    html += '<input type="text" id="fp-clave" class="input input-bordered w-full font-mono uppercase" value="' + clave + '" required></label>';

    html += '<label class="form-control w-full"><span class="label-text">Nombre <span class="text-error">*</span></span>';
    html += '<input type="text" id="fp-nombre" class="input input-bordered w-full" value="' + nombre + '" required></label>';

    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    html += '<label class="form-control w-full"><span class="label-text">Precio Unitario <span class="text-error">*</span></span>';
    html += '<input type="number" id="fp-precio" class="input input-bordered w-full" step="0.01" min="0" value="' + precio + '" required></label>';

    html += '<label class="form-control w-full"><span class="label-text">IVA</span>';
    html += '<select id="fp-iva" class="select select-bordered w-full">';
    html += '<option value="S\u00ed"' + (iva === 'S\u00ed' ? ' selected' : '') + '>S\u00ed (16%)</option>';
    html += '<option value="No"' + (iva === 'No' ? ' selected' : '') + '>No (exento)</option>';
    html += '</select></label>';
    html += '</div>';

    html += '<label class="form-control w-full"><span class="label-text">Categor\u00eda</span>';
    html += '<input type="text" id="fp-categoria" class="input input-bordered w-full" value="' + categoria + '" placeholder="Ej: Servicios Profesionales"></label>';

    UI.modalForm(editando ? 'Editar Producto' : 'Nuevo Producto', html, async function(data) {
      var c = document.getElementById('fp-clave');
      var n = document.getElementById('fp-nombre');
      var p = document.getElementById('fp-precio');
      if (!c || !c.value.trim()) { UI.toast('La clave es obligatoria', 'error'); throw new Error('Validacion'); }
      if (!n || !n.value.trim()) { UI.toast('El nombre es obligatorio', 'error'); throw new Error('Validacion'); }
      if (!p || !p.value || parseFloat(p.value) <= 0) { UI.toast('El precio debe ser mayor a 0', 'error'); throw new Error('Validacion'); }

      var datos = {
        clave: c.value.trim().toUpperCase(),
        nombre: n.value.trim(),
        precioUnitario: parseFloat(p.value),
        iva: document.getElementById('fp-iva').value,
        categoria: document.getElementById('fp-categoria').value.trim()
      };

      if (editando) {
        await ProductosFiscales.actualizar(item.id, datos);
      } else {
        await ProductosFiscales.guardar(datos);
      }
      await ProductosFiscales.cargarLista();
    });
  },

  async guardar(datos) {
    var registro = {
      id: uuid(),
      clave: datos.clave,
      nombre: datos.nombre,
      precioUnitario: datos.precioUnitario,
      iva: datos.iva,
      categoria: datos.categoria,
      createdBy: 'anon',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.productos_fiscales.put(registro);
    UI.toast('Producto guardado correctamente', 'success');
  },

  async actualizar(id, datos) {
    var existente = await db.productos_fiscales.get(id);
    if (!existente) { UI.toast('Producto no encontrado', 'error'); return; }
    var actualizado = Object.assign({}, existente, datos, { id: id, updatedAt: new Date() });
    await db.productos_fiscales.put(actualizado);
    UI.toast('Producto actualizado correctamente', 'success');
  },

  async eliminar(item) {
    var ok = await UI.confirm('\u00bfEliminar ' + (item.nombre || 'este producto') + '?');
    if (!ok) return;
    var enFacturas = await db.facturas_items.where('productoId').equals(item.id).count();
    if (enFacturas > 0) {
      UI.toast('No se puede eliminar: aparece en ' + enFacturas + ' factura(s)', 'error');
      return;
    }
    try {
      await db.productos_fiscales.delete(item.id);
      UI.toast('Producto eliminado correctamente', 'success');
      await this.cargarLista();
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  }
};

window.MODULES = window.MODULES || {};
window.MODULES['productos_fiscales'] = ProductosFiscales;
console.log('📦 Módulo productos_fiscales registrado');
