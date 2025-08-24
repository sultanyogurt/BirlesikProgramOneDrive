
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('birlesikAPI', {
  list: () => ipcRenderer.invoke('db:list'),
  add: (rec) => ipcRenderer.invoke('db:add', rec),
  update: (rec) => ipcRenderer.invoke('db:update', rec),
  remove: (id) => ipcRenderer.invoke('db:remove', id),
  sysPaths: () => ipcRenderer.invoke('sys:paths')
});
