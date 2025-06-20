import { Platform } from '@/src/utils/platform';

type ResponsiveValue<T> = {
  mobile: T;
  desktop: T;
};

export function useResponsiveStyles() {
  const getResponsiveValue = <T>(values: ResponsiveValue<T>): T => {
    return Platform.isMobile ? values.mobile : values.desktop;
  };

  const getResponsiveClass = (mobileClass: string, desktopClass: string): string => {
    return Platform.isMobile ? mobileClass : desktopClass;
  };

  const getResponsiveSize = (mobileSize: number, desktopSize: number): number => {
    return Platform.isMobile ? mobileSize : desktopSize;
  };

  return {
    getResponsiveValue,
    getResponsiveClass,
    getResponsiveSize,
  };
} 