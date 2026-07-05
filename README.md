# AHA PreFactura

Prefacturación offline para freelancers. Genera facturas con folio automático, exporta PDF, control de clientes con RFC.

## Perfil: Lite

App 100% offline-first que funciona abriendo `index.html` en cualquier navegador moderno.

## Stack

- **Frontend:** Alpine.js + DaisyUI 4 + Tailwind CSS (CDN)
- **Iconos:** Bootstrap Icons
- **Animaciones:** Animate.css
- **Base de datos:** Dexie.js (IndexedDB)
- **Cifrado:** CryptoJS (AES)
- **Gráficos:** Chart.js
- **PDF:** jsPDF
- **Compresión:** Pako

## Módulos

1. **Clientes Fiscales** — CRUD con validación de RFC, búsqueda instantánea
2. **Productos Fiscales** — Catálogo de productos/servicios con IVA
3. **Facturas** — Creación multi-paso, folio automático, PDF fiscal
4. **Historial** — Lista de facturas emitidas, filtros, detalle PDF
5. **Reportes** — Dashboard con gráfico de ingresos, export CSV

## Cómo usar

1. Abre `index.html` en tu navegador (doble clic)
2. Los datos se guardan localmente en IndexedDB
3. Para respaldar: usa Exportar/Importar desde la app
4. Para instalar como app: usa "Agregar a pantalla de inicio" del navegador

## Licencia

Plan Lite — 30 registros máximos en producción.
