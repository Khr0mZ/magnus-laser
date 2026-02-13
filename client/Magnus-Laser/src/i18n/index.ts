import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import UI translations
import enTranslation from './locales/en.json'
import esTranslation from './locales/es.json'

// Import table data translations (separate namespace)
import enTables from './locales/tables-en.json'
import esTables from './locales/tables-es.json'

// Configure i18next
i18n.use(initReactI18next) // Initialize react-i18next
    .init({
        resources: {
            en: {
                translation: enTranslation,
                tables: enTables,
            },
            es: {
                translation: esTranslation,
                tables: esTables,
            },
        },
        lng: 'en', // Default language, will be overridden by user preference on load
        fallbackLng: 'en',
        defaultNS: 'translation',
        ns: ['translation', 'tables'],
        //debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false, // React already escapes values
        },
    })

export default i18n
