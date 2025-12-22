import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay to let fonts load
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, []);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#E07A5F',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="auth/login" 
          options={{ title: 'Login' }} 
        />
        <Stack.Screen 
          name="auth/signup" 
          options={{ title: 'Sign Up' }} 
        />
        <Stack.Screen 
          name="feed" 
          options={{ title: 'Sheltr Feed' }} 
        />
        <Stack.Screen 
          name="pet/[id]" 
          options={{ title: 'Pet Details' }} 
        />
      </Stack>
    </AuthProvider>
  );
}
