// module.js — Reportes y Dashboard
const Reportes = {
  id: 'reportes',
  titulo: 'Reportes',
  icono: 'bi bi-bar-chart-line',
  datos: {
    totalFacturadoMes: 0,
    facturasEmitidas: 0,
    clientesRegistrados: 0,
    productosRegistrados: 0,
    ingresosPorMes: []
  },
  cargando: true,
  _chartInstance: null,

  async init() {
    console.log('💡 [reportes] Inicializado');
    await this.cargarDatos();
  },

  render: function() { return ''; },
  destroy: function() {
    if (this._chartInstance) {
      this._chartInstance.destroy();
      this._chartInstance = null;
    }
  },

  async cargarDatos() {
    try {
      this.cargando = true;
      var facturas = await db.facturas.toArray();
      var clientes = await db.clientes_fiscales.count();
      var productos = await db.productos_fiscales.count();

      // Calcular total facturado este mes
      var ahora = new Date();
      var inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      var totalMes = 0;
      facturas.forEach(function(f) {
        var fDate = new Date(f.createdAt);
        if (fDate >= inicioMes) {
          totalMes += parseFloat(f.total || 0);
        }
      });

      // Ingresos por mes (últimos 12 meses)
      var ingresosMap = {};
      for (var i = 0; i < 12; i++) {
        var d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        ingresosMap[key] = 0;
      }
      facturas.forEach(function(f) {
        var fDate = new Date(f.createdAt);
        var key = fDate.getFullYear() + '-' + String(fDate.getMonth() + 1).padStart(2, '0');
        if (ingresosMap[key] !== undefined) {
          ingresosMap[key] += parseFloat(f.total || 0);
        }
      });

      var labels = [];
      var values = [];
      var keys = Object.keys(ingresosMap).sort();
      var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      keys.forEach(function(k) {
        var parts = k.split('-');
        var m = parseInt(parts[1], 10) - 1;
        labels.push(meses[m] + ' ' + parts[0]);
        values.push(ingresosMap[k]);
      });

      this.datos = {
        totalFacturadoMes: totalMes,
        facturasEmitidas: facturas.length,
        clientesRegistrados: clientes,
        productosRegistrados: productos,
        ingresosPorMes: { labels: labels, values: values }
      };

      this.cargando = false;
      var container = document.getElementById('module-container');
      if (container) container.innerHTML = this._renderHTML();
      this._inicializarChart();
    } catch (e) {
      UI.toast('Error al cargar reportes: ' + e.message, 'error');
      this.cargando = false;
    }
  },

  _renderHTML: function() {
    var d = this.datos;
    var html = '<div class="animate__animated animate__fadeInUp">';
    html += '<div class="flex flex-wrap items-center justify-between gap-4 mb-6">';
    html += '  <h2 class="text-2xl font-bold flex items-center gap-2"><i class="bi bi-bar-chart-line text-success"></i> Reportes</h2>';
    html += '  <button class="btn btn-outline btn-sm" onclick="Reportes.exportCSV()"><i class="bi bi-download"></i> Exportar CSV</button>';
    html += '</div>';

    if (this.cargando) {
      html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';
      for (var i = 0; i < 4; i++) {
        html += '<div class="sk-el" style="height:100px"></div>';
      }
      html += '</div><div class="sk-el sk-card"></div>';
      return html;
    }

    // Stats cards
    html += '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';

    html += '  <div class="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><i class="bi bi-cash-stack text-xl"></i></div>';
    html += '      <div><span class="text-xs text-base-content/50 block">Facturado este mes</span><span class="text-xl font-bold font-mono">' + UI.formatCurrency(d.totalFacturadoMes) + '</span></div>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><i class="bi bi-file-earmark-text text-xl"></i></div>';
    html += '      <div><span class="text-xs text-base-content/50 block">Facturas emitidas</span><span class="text-xl font-bold">' + d.facturasEmitidas + '</span></div>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><i class="bi bi-people text-xl"></i></div>';
    html += '      <div><span class="text-xs text-base-content/50 block">Clientes</span><span class="text-xl font-bold">' + d.clientesRegistrados + '</span></div>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">';
    html += '    <div class="flex items-center gap-3">';
    html += '      <div class="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center text-info"><i class="bi bi-box-seam text-xl"></i></div>';
    html += '      <div><span class="text-xs text-base-content/50 block">Productos</span><span class="text-xl font-bold">' + d.productosRegistrados + '</span></div>';
    html += '    </div>';
    html += '  </div>';

    html += '</div>';

    // Chart
    html += '<div class="bg-base-100 rounded-xl p-4 md:p-6 border border-base-200 shadow-sm">';
    html += '  <h3 class="font-semibold mb-4 flex items-center gap-2"><i class="bi bi-graph-up text-primary"></i> Ingresos por Mes</h3>';
    html += '  <div class="relative" style="height:300px">';
    html += '    <canvas id="ingresos-chart"></canvas>';
    html += '  </div>';
    html += '</div>';

    // Últimas facturas
    html += '<div class="mt-6 bg-base-100 rounded-xl p-4 border border-base-200 shadow-sm">';
    html += '  <h3 class="font-semibold mb-3 flex items-center gap-2"><i class="bi bi-clock-history"></i> \u00daltimas Facturas</h3>';
    html += '  <div class="overflow-x-auto">';
    html += '    <table class="table table-sm">';
    html += '      <thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Fecha</th></tr></thead><tbody>';

    var ultimas = this._datosUltimas ? this._datosUltimas : [];
    if (ultimas.length === 0) {
      html += '      <tr><td colspan="4" class="text-center text-base-content/40 py-4">No hay facturas</td></tr>';
    } else {
      for (var i = 0; i < ultimas.length; i++) {
        var f = ultimas[i];
        html += '      <tr>';
        html += '        <td class="font-mono text-sm font-bold">' + UI.formatFolio(f.serie || 'F', f.folio) + '</td>';
        html += '        <td>' + this._esc(f.clienteNombre || '') + '</td>';
        html += '        <td class="font-mono">' + UI.formatCurrency(f.total) + '</td>';
        html += '        <td class="text-sm text-base-content/60">' + UI.formatDate(f.createdAt) + '</td>';
        html += '      </tr>';
      }
    }

    html += '      </tbody></table>';
    html += '  </div>';
    html += '</div>';

    html += '</div>';
    return html;
  },

  _inicializarChart: function() {
    var self = this;
    setTimeout(function() {
      var canvas = document.getElementById('ingresos-chart');
      if (!canvas) return;
      if (self._chartInstance) {
        self._chartInstance.destroy();
      }
      var ctx = canvas.getContext('2d');
      var data = self.datos.ingresosPorMes;
      self._chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Ingresos',
            data: data.values,
            backgroundColor: 'rgba(8, 145, 178, 0.2)',
            borderColor: '#0891b2',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(val) { return '$' + val.toFixed(0); }
              },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }, 100);
  },

  exportCSV: async function() {
    try {
      var facturas = await db.facturas.orderBy('createdAt').toArray();
      if (facturas.length === 0) {
        UI.toast('No hay datos para exportar', 'warning');
        return;
      }
      var BOM = '\uFEFF';
      var csv = BOM + 'Folio,Cliente,Subtotal,IVA,Total,Fecha\n';
      facturas.forEach(function(f) {
        var folio = (f.serie || 'F') + '-' + String(f.folio).padStart(3, '0');
        var cliente = (f.clienteNombre || '').replace(/,/g, ' ');
        var fecha = new Date(f.createdAt).toISOString().slice(0, 10);
        csv += folio + ',' + cliente + ',' + (f.subtotal || 0) + ',' + (f.iva || 0) + ',' + (f.total || 0) + ',' + fecha + '\n';
      });

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Facturas-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      UI.toast('CSV exportado correctamente', 'success');
    } catch (e) {
      UI.toast('Error al exportar CSV: ' + e.message, 'error');
    }
  },

  _datosUltimas: [],
  _esc: function(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  _refresh: function() {
    var container = document.getElementById('module-container');
    if (container) container.innerHTML = this._renderHTML();
    this._inicializarChart();
  }
};

// Add últimas facturas data after cargarDatos
var origCargarDatos = Reportes.cargarDatos;
Reportes.cargarDatos = async function() {
  await origCargarDatos.call(this);
  if (this.datos.facturasEmitidas > 0) {
    this._datosUltimas = await db.facturas.orderBy('createdAt').reverse().limit(5).toArray();
  }
};

window.MODULES = window.MODULES || {};
window.MODULES['reportes'] = Reportes;
console.log('📦 Módulo reportes registrado');
