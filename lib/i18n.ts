import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '../public/locales/en/common.json'
import ruCommon from '../public/locales/ru/common.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      ru: { common: ruCommon }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
