{
  "app": {
    "id": "aha-prefactura",
    "nombre": "AHA PreFactura",
    "version": "1.0.0",
    "tipo": "prefactura",
    "descripcion": "Prefacturación offline para freelancers. Genera facturas con folio automático, exporta PDF, control de clientes con RFC.",
    "plan": "lite"
  },
  "perfil": "lite",
  "iaJutia": { "perfil": false },
  "modulosActivos": ["clientes_fiscales","productos_fiscales","facturas","historial","reportes"],
  "tema": {
    "modo": "claro",
    "colores": {
      "primary": "#0891b2",
      "secondary": "#06b6d4",
      "accent": "#22d3ee",
      "neutral": "#1e293b",
      "base-100": "#ffffff",
      "base-200": "#f1f5f9",
      "base-300": "#e2e8f0",
      "info": "#0ea5e9",
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "tipografia": "Inter, system-ui, sans-serif"
  },
  "cifrado": {
    "camposSensibles": ["rfc", "email"],
    "storageKey": "aha_prefactura_key"
  },
  "modulos": {
    "clientes_fiscales": { "titulo": "Clientes Fiscales", "icono": "bi bi-people", "activo": true },
    "productos_fiscales": { "titulo": "Productos Fiscales", "icono": "bi bi-box-seam", "activo": true },
    "facturas": { "titulo": "Facturas", "icono": "bi bi-file-earmark-text", "activo": true },
    "historial": { "titulo": "Historial", "icono": "bi bi-clock-history", "activo": true },
    "reportes": { "titulo": "Reportes", "icono": "bi bi-bar-chart-line", "activo": true }
  },
  "data": {
    "dir": "data/",
    "maxFileSize": 10485760,
    "tipos": ["avatar","foto","doc","logo","backup"],
    "avatars": { "default": "data/defaults/avatar.svg", "size": 200, "calidad": 0.8 }
  },
  "sync": {
    "primaryFormat": "json",
    "secondaryFormats": [],
    "includeFiles": true,
    "encrypt": true,
    "maxExportSize": 52428800
  },
  "ui": {
    "formsMode": "modal",
    "alerts": "toast",
    "confirmDelete": true,
    "avatars": false,
    "avatarDefault": "data/defaults/avatar.svg"
  }
}
