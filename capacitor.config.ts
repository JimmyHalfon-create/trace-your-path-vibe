import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.808c9e1474e54037b5a045e850c57b1d',
  appName: 'trace-your-path-vibe',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#fbbf24",
      sound: "beep.wav"
    }
  },
};

export default config;