// main.js — Entry point de AHA PreFactura
(function() {
  console.log('🚀 AHA PreFactura v' + (APP_CONFIG.app.version || '1.0.0') + ' iniciando...');

  function init() {
    try {
      // Inicializar router
      if (window.appRouter && window.appRouter.init) {
        window.appRouter.init();
      }

      // Navegación sidebar
      document.body.addEventListener('click', function(e) {
        var link = e.target.closest('.nav-module');
        if (link) {
          e.preventDefault();
          var moduleId = link.dataset.module;
          if (moduleId && window.appRouter) {
            window.location.hash = moduleId;
          }
        }
      });

      // Cargar semilla si está vacío
      if (window.cargarSeedData) {
        setTimeout(window.cargarSeedData, 500);
      }

      // Botón de menú móvil
      var menuBtn = document.getElementById('menu-toggle');
      var sidebar = document.getElementById('sidebar');
      if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function() {
          sidebar.classList.toggle('-translate-x-full');
        });
        // Cerrar sidebar al hacer clic fuera en móvil
        document.addEventListener('click', function(e) {
          if (window.innerWidth < 768 && sidebar && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.add('-translate-x-full');
          }
        });
      }
    } catch (err) {
      console.error('Error en init:', err);
    }
  }

  // Esperar a que DOM cargue
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
