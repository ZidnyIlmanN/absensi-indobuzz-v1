import { Stack } from 'expo-router';

export default function ClockInLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="location" />
      <Stack.Screen name="selfie" />
    </Stack>
  );
}
