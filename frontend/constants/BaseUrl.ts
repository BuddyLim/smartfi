import { isDevice } from "expo-device";

export const BaseURL = isDevice
  ? process.env.EXPO_PUBLIC_DEVICE_BASE_URL
  : process.env.EXPO_PUBLIC_SIMULATOR_BASE_URL;
