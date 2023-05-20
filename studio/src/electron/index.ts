import {
  app,
  BrowserWindow,
  Notification,
  ipcMain,
  // nativeImage
} from 'electron';
import path, { join } from 'path';
import { parse } from 'url';
import { autoUpdater } from 'electron-updater';
import { ChildProcess, fork } from 'child_process';
import logger from './utils/logger';
import settings, { ISettings } from './utils/settings';
import { Server, Socket } from 'socket.io';

const isProd = process.env.NODE_ENV === 'production' || !/[\\/]electron/.exec(process.execPath); // !process.execPath.match(/[\\/]electron/);

logger.info('App starting...');
settings.set('check', true);
logger.info('Checking if settings store works correctly.');
logger.info(settings.get('check') ? 'Settings store works correctly.' : 'Settings store has a problem.');

let mainWindow: BrowserWindow | null;
let serverProcess: ChildProcess;
let notification: Notification | null;

let broadcaster: string;
let metadata: any;
let port = 3000;
let io: Server;

function bootstrap() {
  io = new Server({ cors: { origin: '*' } });

  io.on('error', (error) => {
    console.log('Server: ' + error);
  });

  io.on('connection', (socket: Socket) => {
    socket.on('broadcaster', (secret: string) => {
      if (secret !== settings.get('secret')) {
        console.log('Server: Invalid broadcaster secret');
        return;
      }

      console.log('Server: Broadcaster has connected');
      broadcaster = socket.id;
      socket.broadcast.emit('broadcaster');
    });

    socket.on('port', (secret: string, newPort: number) => {
      if (secret !== settings.get('secret')) {
        console.log('Server: Invalid broadcaster secret');
        return;
      }
      console.log(port);
      port = newPort;
      io.listen(port);
    });

    socket.on('watcher', () => {
      console.log('Server: New watcher has connected');

      if (metadata) {
        socket.emit('metadata', metadata);
      }

      socket.to(broadcaster).emit('watcher', socket.id);
    });

    socket.on('disconnect', () => {
      if (socket.id === broadcaster) {
        socket.broadcast.emit('end');
        metadata = undefined;
      }

      socket.to(broadcaster).emit('disconnectPeer', socket.id);
    });

    //webRTC stuff
    socket.on('offer', ({ id, message }) => {
      socket.to(id).emit('offer', { id: socket.id, message });
    });

    socket.on('answer', ({ id, message }) => {
      socket.to(id).emit('answer', { id: socket.id, message });
    });

    socket.on('candidate', ({ id, message }) => {
      socket.to(id).emit('candidate', { id: socket.id, message });
    });

    socket.on('metadata', (secret: string, song) => {
      if (secret !== settings.get('secret')) {
        console.log('Server: Invalid broadcaster secret');
        return;
      }

      metadata = song;

      socket.broadcast.emit('metadata', song);
    });

    socket.on('question', (question) => {
      socket.to(broadcaster).emit('question', question);
    });
  });

  io.listen(port);
  console.log('Server: Started successfully');
}

const createWindows = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 900,
    minHeight: 630,
    frame: false,
    webPreferences: {
      devTools: true,
      contextIsolation: true,
      // enableRemoteModule: false,
      preload: path.join(__dirname, 'utils', 'preload.js'),
    },
  });

  const url =
    // process.env.NODE_ENV === "production"
    isProd
      ? // in production, use the statically build version of our application
        `file://${join(__dirname, '..', 'public', 'index.html')}`
      : // in dev, target the host and port of the local rollup web server
        'http://localhost:5000';

  mainWindow.loadURL(url).catch((err) => {
    logger.error(JSON.stringify(err));
    console.log(err);
    app.quit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // serverProcess.kill();
    io.close();
  });

  // serverProcess = fork(
  //   !isProd ? './build/server/server.js' : '../server/server.js'
  // );
  bootstrap();
};

app.on('ready', createWindows);

// those two events are completely optional to subscrbe to, but that's a common way to get the
// user experience people expect to have on macOS: do not quit the application directly
// after the user close the last window, instead wait for Command + Q (or equivalent).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindows();
});

app.on('web-contents-created', (e, contents) => {
  logger.info(e);
  // Security of webviews
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    logger.info(event, params);
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload;

    // Disable Node.js integration
    webPreferences.nodeIntegration = false;

    // Verify URL being loaded
    // if (!params.src.startsWith(`file://${join(__dirname)}`)) {
    //   event.preventDefault(); // We do not open anything now
    // }
  });

  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedURL = parse(navigationUrl);
    // In dev mode allow Hot Module Replacement
    if (parsedURL.host !== 'localhost:5000' && !isProd) {
      logger.warn('Stopped attempt to open: ' + navigationUrl);
      event.preventDefault();
    } else if (isProd) {
      logger.warn('Stopped attempt to open: ' + navigationUrl);
      event.preventDefault();
    }
  });
});

// if (isProd)
//   autoUpdater.checkForUpdates().catch((err) => {
//     logger.error(JSON.stringify(err));
//   });

// autoUpdater.logger = logger;

// autoUpdater.on('update-available', () => {
//   notification = new Notification({
//     title: 'Fluide',
//     body: 'Updates are available. Click to download.',
//     silent: true,
//     // icon: nativeImage.createFromPath(join(__dirname, "..", "assets", "icon.png"),
//   });
//   notification.show();
//   notification.on('click', () => {
//     autoUpdater.downloadUpdate().catch((err) => {
//       logger.error(JSON.stringify(err));
//     });
//   });
// });

// autoUpdater.on('update-not-available', () => {
//   notification = new Notification({
//     title: 'Fluide',
//     body: 'Your software is up to date.',
//     silent: true,
//     // icon: nativeImage.createFromPath(join(__dirname, "..", "assets", "icon.png"),
//   });
//   notification.show();
// });

// autoUpdater.on('update-downloaded', () => {
//   notification = new Notification({
//     title: 'Fluide',
//     body: 'The updates are ready. Click to quit and install.',
//     silent: true,
//     // icon: nativeImage.createFromPath(join(__dirname, "..", "assets", "icon.png"),
//   });
//   notification.show();
//   notification.on('click', () => {
//     autoUpdater.quitAndInstall();
//   });
// });

// autoUpdater.on('error', (err) => {
//   notification = new Notification({
//     title: 'Fluide',
//     body: JSON.stringify(err),
//     // icon: nativeImage.createFromPath(join(__dirname, "..", "assets", "icon.png"),
//   });
//   notification.show();
// });

ipcMain.handle('getSettingsVal', (event, key: keyof ISettings) => {
  return settings.get(key);
});

ipcMain.handle('setSettingsVal', (e, key: keyof ISettings, val: any) => {
  settings.set(key, val);
});

ipcMain.on('window', (event, action: 'minimize' | 'maximize' | 'close') => {
  if (!mainWindow) return;

  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;

    case 'maximize':
      mainWindow.maximize();
      break;

    case 'close':
      mainWindow.close();
      break;
  }
});

process.on('uncaughtException', function (err) {
  console.log(err);
});
