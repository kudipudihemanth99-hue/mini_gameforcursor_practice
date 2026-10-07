const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('node:path');

function createWindow() {
    const window = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 720,
        minHeight: 600,
        backgroundColor: '#070913',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    window.loadFile(path.join(__dirname, 'index.html'));
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(() => {
    app.setName('Neon Pulse');
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: 'Game',
            submenu: [
                { label: 'Toggle Full Screen', role: 'togglefullscreen' },
                { type: 'separator' },
                { label: 'Quit', role: 'quit', accelerator: 'Ctrl+Q' }
            ]
        },
        {
            label: 'Help',
            submenu: [{
                label: 'About Neon Pulse',
                click: () => dialog.showMessageBox({
                    type: 'info',
                    title: 'About Neon Pulse',
                    message: 'Neon Pulse',
                    detail: `Arcade survival game\nVersion ${app.getVersion()}`
                })
            }]
        }
    ]));

    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});