const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electron", {
    onVideoSelected: (callback) => {
        ipcRenderer.on("video-selected", (event, filePath) => {
            try {
                callback(filePath);
            } catch (error) {
                console.error("Error in onVideoSelected callback:", error);
            }
        });
    }
});
