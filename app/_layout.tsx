import "@/global.css";
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useThemePreset } from '@/src/components/ui/ThemeProvider';
import { ConfirmationModal } from '@/src/components/ui/ConfirmationModal';
import { rawThemes } from '@/constants/themes';
import { useColorScheme } from 'nativewind';
import { Toast } from "@/src/components/ui/Toast";
import { View } from "react-native";
import { WebSidebar } from "@/src/components/navigation/WebSidebar";
import { routes } from "./(tabs)/_layout";
import { Command } from "@tauri-apps/plugin-shell";
import { CustomHeader } from "@/src/components/navigation/CustomHeader";
import { useKeyboardShortcuts } from "@/src/hooks/useKeyboardShortcuts";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAtom, useAtomValue } from 'jotai';
import { hasSeenOnboardingAtom, syncToPolarisAtom } from '@/src/hooks/atoms';
import { Platform } from '@/src/utils/platform';
import { WelcomeIntroduction } from "@/src/components/onboarding/WelcomeIntroduction";
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ProxyUrlSync } from "@/src/components/ProxyUrlSync";
import { localeAtom } from '@/src/hooks/atoms';
import { setupAuthCallbackListener, checkStoredAuthToken } from '@/src/utils/authCallback';
import '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { themePreset } = useThemePreset();
  const { colorScheme } = useColorScheme();
  const [syncToPolaris] = useAtom(syncToPolarisAtom);
  const locale = useAtomValue(localeAtom);
  useKeyboardShortcuts();

  const theme = React.useMemo(() => {
    if (!rawThemes[themePreset]) {
      return rawThemes['default'][colorScheme ?? 'light'];
    }
    return rawThemes[themePreset][colorScheme ?? 'light'];
  }, [themePreset, colorScheme]);

  const isDesktop = Platform.isDesktop && window.innerWidth >= 768;

  const myFunc = async function() {
    
  }
  if(Platform.isTauri) {
    myFunc();
  }


  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Caveat-Regular': require('../assets/fonts/Caveat-Regular.ttf'),
    'Caveat-Medium': require('../assets/fonts/Caveat-Medium.ttf'),
    'Caveat-Bold': require('../assets/fonts/Caveat-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
  }, [locale])

  const hasSeenOnboarding = useAtomValue(hasSeenOnboardingAtom);

  useEffect(() => {
    // Setup auth callback listener for web platforms
    if (Platform.isWeb) {
      setupAuthCallbackListener();
      checkStoredAuthToken();
      
      // Listen for the custom event
      const handleAuthEvent = (event: CustomEvent) => {
        const { token } = event.detail;
        console.log("Received auth token from event:", token);
        
        // Handle the token (you might need to connect to your Polaris server here)
        // This depends on your app structure
      };
      
      window.addEventListener('polaris-auth', handleAuthEvent as EventListener);
      return () => {
        window.removeEventListener('polaris-auth', handleAuthEvent as EventListener);
      };
    }
  }, []);

  if (!loaded) {
    return null;
  }
  

  return (
    <GestureHandlerRootView>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemeProvider>
        <ProxyUrlSync />
        <View className={`flex-row flex-1 bg-background`}>
          {isDesktop && <WebSidebar className="" />}
          <Stack screenOptions={{
            headerStyle: {
              backgroundColor: theme.surface
            },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            header: () => <CustomHeader />,
            contentStyle: {
              backgroundColor: theme.background
            }
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        <ConfirmationModal />
        <Toast />
        {!hasSeenOnboarding && <WelcomeIntroduction />}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
