import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkSession = async (): Promise<boolean> => {
  const isLogin = await AsyncStorage.getItem('isLogin');
  return !!isLogin;
};