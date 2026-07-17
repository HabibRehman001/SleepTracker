/**
 * Sensor / motion helpers will wrap expo-sensors (accelerometer, pedometer).
 * Placeholder exports keep the dependency boundary clear (Step 120).
 */
export const SENSOR_PACKAGES = {
  accelerometer: 'expo-sensors',
  pedometer: 'expo-sensors',
} as const
