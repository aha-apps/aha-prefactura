// file-store.js — Gestión de archivos en memoria (Lite)
window.FileStore = {
  APP_DATA_DIR: 'data/',

  async save: function(tipo, nombre, blob) {
    var path = tipo + '/' + uuid() + '-' + nombre;
    var arrayBuffer = await blob.arrayBuffer();
    var wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    var hash = CryptoJS.SHA256(wordArray).toString();
    await db._files.put({
      path: path,
      tipo: tipo,
      nombre: nombre,
      mime: blob.type,
      size: blob.size,
      hash: hash,
      refCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    // En Lite, guardar blobs en _file_blobs
    await db._file_blobs.put({ path: path, data: arrayBuffer });
    var url = URL.createObjectURL(blob);
    return { path: path, hash: hash, url: url };
  },

  async getURL: function(path) {
    if (!path) return null;
    try {
      var blobData = await db._file_blobs.get(path);
      if (blobData && blobData.data) {
        var meta = await db._files.get(path);
        var mime = meta ? meta.mime : 'application/octet-stream';
        var blob = new Blob([blobData.data], { type: mime });
        return URL.createObjectURL(blob);
      }
    } catch (e) { console.error('FileStore.getURL:', e); }
    return null;
  },

  async read: function(path) {
    try {
      var blobData = await db._file_blobs.get(path);
      if (blobData && blobData.data) {
        var meta = await db._files.get(path);
        return new Blob([blobData.data], { type: meta ? meta.mime : 'application/octet-stream' });
      }
    } catch (e) { console.error('FileStore.read:', e); }
    return null;
  },

  async delete: function(path) {
    try {
      await db._file_blobs.delete(path);
      await db._files.delete(path);
    } catch (e) { console.error('FileStore.delete:', e); }
  },

  async cleanOrphans: function() {
    var files = await db._files.where('refCount').equals(0).toArray();
    for (var i = 0; i < files.length; i++) {
      await this.delete(files[i].path);
    }
  },

  async meta: function(path) {
    return await db._files.get(path);
  },

  avatarDefault: function() {
    return 'data/defaults/avatar.svg';
  }
};
