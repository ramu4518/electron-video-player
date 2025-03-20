const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
        },
        icon: path.join(__dirname, "rabbit-1.png"),
    });

    mainWindow.loadFile("index.html");

    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Choose Video",
                    click: async () => {
                        try {
                            const result = await dialog.showOpenDialog(mainWindow, {
                                properties: ["openFile"],
                                filters: [{ name: "Videos", extensions: ["mp4", "mkv", "avi", "mov"] }],
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                mainWindow.webContents.send("video-selected", result.filePaths[0]);
                            }
                        } catch (error) {
                            console.error("Error selecting file: " + error.message);
                        }
                    },
                },
                { role: "quit" },
            ],
        },
        {
            label: "Audio",
            submenu: [
                {
                    label: "Updates are underway",
                },
            ],
        },
        {
            label: "Subtitles",
            submenu: [
                {
                    label: "Updates are underway",
                },
            ],
        },
        {
            label: "About",
            submenu: [
                {
                    label: "About B-Rabbit Video Player",
                    click: () => {
                        dialog.showMessageBox({
                            title: "About B-Rabbit Video Player",
                            message: "B-Rabbit Video Player\nVersion 1.0.0\nDeveloped by RamaKrishnan A\nBuilt with Electron.js",
                            buttons: ["OK"]
                        });
                    },
                },
            ],
        },
    ]);

    Menu.setApplicationMenu(menu);

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
