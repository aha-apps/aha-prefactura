// search-palette.js — Command Palette (Ctrl+K) con navegación de módulos
(function() {
  var paletteData = {
    open: false,
    query: '',
    selectedIdx: 0,
    keyboardNav: false,
    filtered: [],
    modules: []
  };

  // Construir lista de módulos desde APP_CONFIG
  function buildModules() {
    var list = [];
    if (APP_CONFIG && APP_CONFIG.modulos) {
      for (var key in APP_CONFIG.modulos) {
        if (APP_CONFIG.modulos.hasOwnProperty(key) && APP_CONFIG.modulos[key].activo) {
          list.push({
            id: key,
            title: APP_CONFIG.modulos[key].titulo || key,
            icon: (APP_CONFIG.modulos[key].icono || 'bi bi-folder').replace('bi ', ''),
            type: 'module'
          });
        }
      }
    }
    return list;
  }

  function filterItems(query) {
    var all = paletteData.modules;
    if (!query || query.length < 2) return all.slice(0);
    var q = query.toLowerCase();
    return all.filter(function(item) {
      return item.title.toLowerCase().indexOf(q) !== -1 || item.id.toLowerCase().indexOf(q) !== -1;
    });
  }

  window.searchPalette = {
    open: paletteData.open,
    query: paletteData.query,
    selectedIdx: paletteData.selectedIdx,
    keyboardNav: paletteData.keyboardNav,
    filtered: paletteData.filtered,

    init: function() {
      var self = this;
      paletteData.modules = buildModules();
      this.filtered = paletteData.modules.slice(0);
    },

    openPalette: function() {
      this.open = true;
      this.query = '';
      this.selectedIdx = 0;
      this.keyboardNav = false;
      paletteData.modules = buildModules();
      this.filtered = paletteData.modules.slice(0);
      var self = this;
      setTimeout(function() {
        var input = document.querySelector('.sp-search-input');
        if (input) input.focus();
      }, 100);
    },

    closePalette: function() {
      this.open = false;
    },

    selectItem: function(item) {
      this.closePalette();
      if (item.type === 'module') {
        if (window.appRouter && window.appRouter.navigate) {
          window.appRouter.navigate(item.id);
        }
      }
    },

    onKeydown: function(e) {
      if (!this.open) return;
      if (e.key === 'Escape') {
        this.closePalette();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.keyboardNav = true;
        this.selectedIdx = Math.min(this.selectedIdx + 1, this.filtered.length - 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.keyboardNav = true;
        this.selectedIdx = Math.max(this.selectedIdx - 1, 0);
      }
      if (e.key === 'Enter' && this.filtered[this.selectedIdx]) {
        e.preventDefault();
        this.selectItem(this.filtered[this.selectedIdx]);
      }
    },

    get hasResults() {
      return this.filtered.length > 0;
    }
  };
})();
