import { Stack } from 'expo-router';

export default function ClockOutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="selfie" />
    </Stack>
  );
}