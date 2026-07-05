// seed.js — Datos de semilla para AHA PreFactura
window.seedData = {
  regimenesFiscales: [
    { id: '601', nombre: 'General de Ley Personas Morales' },
    { id: '603', nombre: 'Personas Morales con Fines no Lucrativos' },
    { id: '605', nombre: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
    { id: '606', nombre: 'Arrendamiento' },
    { id: '607', nombre: 'Régimen de Enajenación o Adquisición de Bienes' },
    { id: '608', nombre: 'Demás ingresos' },
    { id: '609', nombre: 'Consolidación' },
    { id: '610', nombre: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
    { id: '611', nombre: 'Ingresos por Dividendos (socios y accionistas)' },
    { id: '612', nombre: 'Personas Físicas con Actividades Empresariales y Profesionales' },
    { id: '614', nombre: 'Ingresos por intereses' },
    { id: '615', nombre: 'Régimen de los ingresos por obtención de premios' },
    { id: '616', nombre: 'Sin obligaciones fiscales' },
    { id: '620', nombre: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
    { id: '621', nombre: 'Incorporación Fiscal' },
    { id: '622', nombre: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
    { id: '623', nombre: 'Opcional para Grupos de Sociedades' },
    { id: '624', nombre: 'Coordinados' },
    { id: '625', nombre: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
    { id: '626', nombre: 'Régimen Simplificado de Confianza' }
  ],

  productosEjemplo: [
    { clave: 'SERV-001', nombre: 'Consultoría profesional', precioUnitario: 1500.00, iva: true, categoria: 'Servicios Profesionales' },
    { clave: 'SERV-002', nombre: 'Desarrollo de software', precioUnitario: 2500.00, iva: true, categoria: 'Servicios Profesionales' },
    { clave: 'SERV-003', nombre: 'Diseño gráfico', precioUnitario: 800.00, iva: true, categoria: 'Servicios Profesionales' },
    { clave: 'SERV-004', nombre: 'Asesoría fiscal', precioUnitario: 1200.00, iva: true, categoria: 'Servicios Profesionales' },
    { clave: 'SERV-005', nombre: 'Clase particular', precioUnitario: 350.00, iva: false, categoria: 'Educación' },
    { clave: 'PROD-001', nombre: 'Material didáctico', precioUnitario: 250.00, iva: true, categoria: 'Materiales' },
    { clave: 'PROD-002', nombre: 'Licencia de software mensual', precioUnitario: 499.00, iva: true, categoria: 'Software' },
    { clave: 'SERV-006', nombre: 'Mantenimiento preventivo', precioUnitario: 600.00, iva: true, categoria: 'Servicios Técnicos' }
  ]
};

window.cargarSeedData = async function() {
  var countClientes = await db.clientes_fiscales.count();
  var countProductos = await db.productos_fiscales.count();
  if (countClientes === 0 && countProductos === 0) {
    UI.toast('Cargando datos de ejemplo...', 'info');
    // Cargar productos ejemplo
    var productos = window.seedData.productosEjemplo;
    for (var i = 0; i < productos.length; i++) {
      var p = productos[i];
      await db.productos_fiscales.put({
        id: uuid(),
        clave: p.clave,
        nombre: p.nombre,
        precioUnitario: p.precioUnitario,
        iva: p.iva ? 'Sí' : 'No',
        categoria: p.categoria,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    UI.toast(productos.length + ' productos de ejemplo cargados', 'success');
  }
};
