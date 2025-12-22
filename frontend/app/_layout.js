import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
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
