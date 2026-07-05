// app.js — Router hash-based y sistema de módulos
window.appRouter = {
  currentView: null,
  currentModule: null,
  moduleInstances: {},

  init: function() {
    var self = this;
    window.addEventListener('hashchange', function() { self._onHashChange(); });
    this._onHashChange();
  },

  _onHashChange: function() {
    var hash = window.location.hash.replace('#', '') || 'clientes_fiscales';
    this.navigate(hash);
  },

  navigate: function(moduleId) {
    var mod = window.MODULES && window.MODULES[moduleId];
    if (!mod) {
      console.warn('Módulo no encontrado:', moduleId);
      moduleId = 'clientes_fiscales';
      mod = window.MODULES && window.MODULES[moduleId];
      if (!mod) return;
    }
    if (this.currentModule && this.currentModule.destroy) {
      this.currentModule.destroy();
    }
    this.currentView = moduleId;
    this.currentModule = mod;
    if (mod.render) {
      var container = document.getElementById('module-container');
      if (container) {
        container.innerHTML = '';
        var result = mod.render();
        if (typeof result === 'string') {
          container.innerHTML = result;
        }
      }
    }
    if (mod.init) mod.init();
    // Actualizar sidebar activo
    var links = document.querySelectorAll('.nav-module');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('active', links[i].dataset.module === moduleId);
    }
  },

  register: function(moduleId, instance) {
    window.MODULES = window.MODULES || {};
    window.MODULES[moduleId] = instance;
    this.moduleInstances[moduleId] = instance;
  }
};

// Inicialización global
window.MODULES = window.MODULES || {};

console.log('🗺️ appRouter ready');
