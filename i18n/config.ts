export const defaultLocale = 'en';
export const locales = ['en', 'ru'] as const;

export const translations = {
  en: {
    'common.navigation.home': 'Home'
  },
  ru: {
    'common.navigation.home': 'Главная'
  }
} as const;
