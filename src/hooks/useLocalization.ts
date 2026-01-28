import { useAtom } from 'jotai';
import { localeAtom } from './atoms';
import { useTranslation } from 'react-i18next';
import i18n, { changeLanguage, i18nJs } from '../../i18n';
import { getDefaultStore } from "jotai";

/**
 * Hook for handling localization in the app
 * Returns the current locale and a function to change it
 * 
 * Note: Initialization is handled in i18n.ts, not here to prevent infinite loops
 */
export const useLocalization = () => {
  const [locale, setLocale] = useAtom(localeAtom);
  const { t: reactI18nextT } = useTranslation();

  // Function to change the locale
  const changeLocale = async (newLocale: string) => {
    if (newLocale) {
      await changeLanguage(newLocale);
      setLocale(newLocale);
      await getDefaultStore().set(localeAtom, newLocale);
    }
  };

  const t = (key: string, options?: any): string => {
    try {
      return reactI18nextT(key, options) as string;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key; // Return the key itself as fallback
    }
  };

  return {
    locale: locale || 'en', // Ensure we always have a locale
    changeLocale,
    t,
    i18n: i18nJs
  };
};

export default i18nJs; 