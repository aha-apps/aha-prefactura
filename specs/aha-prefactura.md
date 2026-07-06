# AHA PreFactura — Spec Funcional

## Identidad

- **Nombre:** AHA PreFactura
- **Tagline:** Genera prefacturas al instante
- **Color:** #06b6d4 (cyan-600)
- **Target:** Freelancers, pequeños negocios, profesionistas independientes
- **Perfil:** Lite (file://, doble clic)

## Stack

- Alpine.js 3 + Dexie 3 + DaisyUI 4 + Tailwind Play CDN + Bootstrap Icons
- ES5 estricto, offline-first, sin servidor
- Chart.js 4 para gráficos en reportes

## DB Schema (Dexie)

```
clientes: ++id, nombre, rfc, telefono, email, direccion, createdBy, createdAt, updatedAt
productos: ++id, nombre, unidad, precioUnitario, createdBy, createdAt, updatedAt
prefacturas: ++id, clienteId, folio, subtotal, iva, total, estado, createdBy, createdAt, updatedAt
items_prefactura: ++id, prefacturaId, productoId, cantidad, precioUnitario, importe, createdAt
```

## Módulos

### 1. Clientes (`#/clientes`)
- CRUD completo
- Campos: nombre, RFC, teléfono, email, dirección (para CFDI)
- Búsqueda por nombre, RFC

### 2. Productos (`#/productos`)
- CRUD de productos o servicios
- Campos: nombre, unidad (pieza/hora/servicio/día), precio unitario
- Precio sin IVA (el cálculo se hace en la prefactura)

### 3. PreFacturas (`#/prefacturas`)
- Crear prefactura con:
  - Selección de cliente (buscador)
  - Folio automático (año-mes-secuencial)
  - Agregar items: producto, cantidad, precio unitario
  - Cálculo automático: importe = cantidad * precioUnitario, subtotal = suma importes, IVA = subtotal * 0.16, total = subtotal + IVA
- Estados: borrador, emitida, pagada, cancelada
- Vista previa imprimible
- Botón "Copiar folio" y "Descargar resumen"

### 4. Historial (`#/historial`)
- Lista de prefacturas emitidas
- Filtros por cliente, estado, rango de fechas
- Detalle completo de cada prefactura
- Cambiar estado (emitir, marcar pagada, cancelar)

### 5. Reportes (`#/reportes`)
- Dashboard con Chart.js:
  - Prefacturas por mes: gráfico de barras
  - Totales por mes: ingresos proyectados
  - Prefacturas por estado: gráfico de pastel (borrador, emitida, pagada, cancelada)
  - Top clientes por monto: ranking

## Estilo

- DaisyUI tema cyan (cyan-600 como primario)
- Layout: sidebar + contenido principal
- Tablas responsive con scroll horizontal en móvil
- Formularios en modal (UI.modalForm)
- Toasts para feedback de operaciones
