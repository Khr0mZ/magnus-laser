import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translations
import enTranslation from './locales/en.json'

// Configure i18next
i18n.use(initReactI18next) // Initialize react-i18next
    .init({
        resources: {
            en: {
                translation: enTranslation,
            },
        },
        lng: 'en', // Always use English
        fallbackLng: 'en',
        //debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false, // React already escapes values
        },
    })

export default i18n
