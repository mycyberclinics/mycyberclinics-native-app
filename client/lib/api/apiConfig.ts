import { Platform } from 'react-native';

// Get your LAN IP if testing on a real device (e.g. 192.168.1.50)
const LAN_IP = '192.168.1.50';

export const apiBaseUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000'
    : Platform.OS === 'ios'
      ? 'http://localhost:4000'
      : Platform.OS === 'web'
        ? 'http://localhost:4000'
        : `http://${LAN_IP}:4000`;
// For production, use your actual backend URL, e.g.:
// export const apiBaseUrl = 'https://yourdomain.com'; // <-- your production backend URL here!