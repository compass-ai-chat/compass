import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { getDefaultStore } from "jotai";
// Import your translation files
import en from '@/assets/translations/en.json';
import it from '@/assets/translations/it.json';
import da from '@/assets/translations/da.json';
import { localeAtom } from './src/hooks/atoms';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'it', 'da'],
    fallbackLng: 'en',
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false, // Not needed for React as it escapes by default
    },
    
    resources: {
      en: {
        translation: en
      },
      it: {
        translation: it
      },
      da: {
        translation: da
      }
    }
  });

// Create the i18n-js instance for backward compatibility
const i18nJs = new I18n({
  en,
  it,
  da
});

// Set initial language
const setInitialLanguage = async () => {
  try {
    // Try to get stored language from storage first
    const storedLang = await getDefaultStore().get(localeAtom);
    if (storedLang && ['en', 'it', 'da'].includes(storedLang)) {
      await i18n.changeLanguage(storedLang);
      i18nJs.locale = storedLang;
      return;
    }
    
    // Fall back to device locale if no stored preference
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    // Ensure deviceLocale is a supported language
    const supportedDeviceLocale = deviceLocale && ['en', 'it', 'da'].includes(deviceLocale) ? deviceLocale : 'en';
    await i18n.changeLanguage(supportedDeviceLocale);
    i18nJs.locale = supportedDeviceLocale;
  } catch (error) {
    console.error('Error setting initial language:', error);
    // Ensure we always have a working language
    await i18n.changeLanguage('en');
    i18nJs.locale = 'en';
  }
};

// Initialize the language
setInitialLanguage();

// Sync the language between i18next and i18n-js
i18n.on('languageChanged', (lng) => {
  i18nJs.locale = lng;
  getDefaultStore().set(localeAtom, lng);
});

// Add this function to change language programmatically
export const changeLanguage = (language: string) => {
  return i18n.changeLanguage(language);
};

export { i18nJs };
export default i18n;
