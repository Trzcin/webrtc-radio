import ElectronStore = require('electron-store');

export interface ISettings {
  check: boolean;
  secret: string;
  port: number;
}

const settings = new ElectronStore<ISettings>({
  defaults: {
    check: false,
    secret: 'cookie',
    port: 3000,
  },
});

export default settings;
