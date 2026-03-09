import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Splash */}
          <Stack.Screen name="index"       options={{ headerShown: false, animation: 'none' }} />
          {/* Pre-auth */}
          <Stack.Screen name="onboarding"  options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="login"       options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="permissions" options={{ headerShown: false, animation: 'slide_from_right' }} />
          {/* Authenticated app */}
          <Stack.Screen name="(tabs)"      options={{ headerShown: false, animation: 'fade' }} />
          {/* Modal */}
          <Stack.Screen name="modal"       options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
