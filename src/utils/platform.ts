import { Platform as ExpoPlatform } from 'react-native';

export const Platform = {
  
  // Check if running in Tauri
  isTauri: typeof window !== 'undefined' && !!(window as any).__TAURI__,
  
  // Check if running in browser (web but not Tauri)
  isWeb: typeof window !== 'undefined' && !(window as any).__TAURI__ && ExpoPlatform.OS=='web',

  isDesktop: typeof window !== 'undefined' || (window as any).__TAURI__,

  // Check if running on mobile (iOS/Android)
  isMobile: ExpoPlatform.OS != 'web',
  
  // Specific platform checks
  isIOS: ExpoPlatform.OS =='ios',
  isAndroid: ExpoPlatform.OS =='android',
  
  // Helper method to get platform type
  getPlatformType(): 'mobile' | 'web' | 'tauri' {
    if (this.isMobile) return 'mobile';
    if (this.isTauri) return 'tauri';
    return 'web';
  }
}; 