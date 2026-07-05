// sync.js — Export/Import de datos offline-first (.ateje-backup)
window.SyncEngine = {
  _password: '',
  _excludeTables: ['_ia_chats', '_ia_messages', 'modelos_cache'],

  setPassword: function(pwd) {
    this._password = pwd || '';
  },

  exportar: async function(password) {
    var pwd = password || this._password;
    try {
      UI.toast('Preparando respaldo...', 'info');
      var tables = {};
      var files, blobs;
      var appName = APP_CONFIG.app.nombre || 'AHA PreFactura';

      if (db._files) {
        files = await db._files.toArray();
        if (db._file_blobs && APP_CONFIG.perfil === 'lite') {
          blobs = await db._file_blobs.toArray();
        }
      }

      for (var i = 0; i < db.tables.length; i++) {
        var table = db.tables[i];
        if (this._excludeTables.indexOf(table.name) !== -1) continue;
        if (table.name === '_files' || table.name === '_file_blobs') continue;
        var records = await table.toArray();
        if (records.length) tables[table.name] = records;
      }

      if (!Object.keys(tables).length && !(files && files.length)) {
        UI.toast('No hay datos para exportar', 'warning');
        return;
      }

      var payload = JSON.stringify({
        version: 2,
        app: appName,
        exportedAt: new Date().toISOString(),
        tables: tables,
        files: files,
        blobs: blobs
      });

      var compressed = pako.deflate(payload, { level: 9 });
      var blob;
      if (pwd) {
        var encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(compressed), pwd).toString();
        blob = new Blob([encrypted], { type: 'application/octet-stream' });
      } else {
        blob = new Blob([compressed], { type: 'application/octet-stream' });
      }

      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = appName.replace(/\s+/g, '-') + '-' + new Date().toISOString().slice(0, 10) + '.ateje-backup';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      var fileInfo = (files && files.length) ? (' + ' + files.length + ' archivos') : '';
      UI.toast('Respaldo exportado (' + (blob.size / 1024).toFixed(1) + ' KB' + fileInfo + ')', 'success');
    } catch (err) {
      UI.toast('Error al exportar: ' + err.message, 'error');
    }
  },

  importar: async function(file, password) {
    var pwd = password || this._password;
    try {
      UI.toast('Leyendo respaldo...', 'info');
      var data;
      if (file instanceof File) {
        data = await file.arrayBuffer();
      } else {
        data = file;
      }
      var decompressed;
      if (pwd) {
        var decrypted = CryptoJS.AES.decrypt(
          typeof data === 'string' ? data : new TextDecoder().decode(data),
          pwd
        );
        var raw = decrypted.toString(CryptoJS.enc.Latin1);
        if (!raw) { UI.toast('Contraseña incorrecta o archivo inválido', 'error'); return; }
        decompressed = pako.inflate(raw, { to: 'string' });
      } else {
        decompressed = pako.inflate(data, { to: 'string' });
      }
      var backup = JSON.parse(decompressed);
      if (backup.version !== 2 && backup.version !== 1) {
        UI.toast('Formato de respaldo no compatible', 'error');
        return;
      }
      UI.toast('Restaurando datos...', 'info');
      UI.loading(true);

      if (backup.files && db._files) {
        for (var fi = 0; fi < backup.files.length; fi++) {
          await db._files.put(backup.files[fi]);
        }
      }
      if (backup.blobs && db._file_blobs) {
        for (var bi = 0; bi < backup.blobs.length; bi++) {
          var b = backup.blobs[bi];
          if (b.data && typeof b.data === 'object' && b.data.byteLength !== undefined) {
            await db._file_blobs.put({ path: b.path, data: b.data });
          } else if (b.data) {
            await db._file_blobs.put({ path: b.path, data: b.data });
          }
        }
      }
      for (var t in backup.tables) {
        if (backup.tables.hasOwnProperty(t) && db[t]) {
          await db[t].clear();
          if (backup.tables[t].length) {
            await db[t].bulkAdd(backup.tables[t]);
          }
        }
      }
      UI.loading(false);
      UI.toast('Respaldo restaurado correctamente', 'success');
      return true;
    } catch (err) {
      UI.loading(false);
      UI.toast('Error al importar: ' + err.message, 'error');
    }
  }
};
