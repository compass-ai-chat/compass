import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { I18nManager } from 'react-native';
import { localeAtom } from './atoms';
import { useTranslation } from 'react-i18next';
import i18n, { changeLanguage, i18nJs } from '../../i18n';
import * as Localization from 'expo-localization';
import { storage } from '@/src/utils/storage';

/**
 * Hook for handling localization in the app
 * Returns the current locale and a function to change it
 */
export const useLocalization = () => {
  const [locale, setLocale] = useAtom(localeAtom);
  const { t: reactI18nextT } = useTranslation();

  useEffect(() => {
    const initializeLocale = async () => {
      try {
        if (locale) {
          await changeLanguage(locale);
          return;
        }

        // Try to get stored language from storage
        const storedLang = await storage.getItem('locale');
        if (storedLang && ['en', 'it', 'da'].includes(storedLang)) {
          setLocale(storedLang);
          return;
        }

        // Fall back to device locale if no stored preference
        const deviceLocale = Localization.getLocales()[0].languageCode;
        const supportedDeviceLocale = deviceLocale && ['en', 'it', 'da'].includes(deviceLocale) ? deviceLocale : 'en';
        setLocale(supportedDeviceLocale);
      } catch (error) {
        console.error('Error initializing locale:', error);
        setLocale('en');
      }
    };

    initializeLocale();
  }, [locale]);

  // Function to change the locale
  const changeLocale = async (newLocale: string) => {
    if (newLocale) {
      await changeLanguage(newLocale);
      setLocale(newLocale);
      await storage.setItem('locale', newLocale);
    }
  };

  // Use the t function from react-i18next but maintain backward compatibility
  const t = (key: string, options?: any) => {
    return reactI18nextT(key, options) as string;
  };

  return {
    locale,
    changeLocale,
    t,
    i18n, // Export the i18n instance for direct access if needed
  };
};

export default i18nJs; 