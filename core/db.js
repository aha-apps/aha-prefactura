// db.js — Inicialización Dexie para AHA PreFactura Lite
var db = new Dexie('AHA_PreFactura');

db.version(2).stores({
  clientes_fiscales: 'id, nombre, *rfc, *regimen, direccion, email, *telefono, createdAt, updatedAt',
  productos_fiscales: 'id, *clave, nombre, precioUnitario, *iva, *categoria, createdAt, updatedAt',
  facturas: 'id, *folio, *serie, *clienteId, subtotal, iva, total, *createdBy, createdAt, updatedAt',
  facturas_items: 'id, *facturaId, *productoId, cantidad, precioUnitario, importe',
  _sync_log: 'id, tipo, fecha, detalle',
  _ia_chats: 'id, titulo, createdAt, updatedAt',
  _ia_messages: 'id, chatId, rol, contenido, timestamp',
  _files: '&path, tipo, nombre, mime, size, hash, refCount, createdAt, updatedAt',
  _file_blobs: '&path'
});

db.version(1).stores({
  clientes_fiscales: 'id, nombre, *rfc, *regimen, email, *telefono, createdAt, updatedAt',
  productos_fiscales: 'id, *clave, nombre, precioUnitario, *iva, *categoria, createdAt, updatedAt',
  facturas: 'id, *folio, *serie, *clienteId, subtotal, iva, total, createdAt, updatedAt',
  facturas_items: 'id, *facturaId, *productoId, cantidad, precioUnitario, importe',
  _sync_log: 'id, tipo, fecha, detalle'
});

db.on('ready', function() {
  console.log('📀 Dexie ready — AHA PreFactura');
});

db.open().catch(function(err) {
  console.error('❌ Dexie open error:', err);
});
