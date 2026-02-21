import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import UI translations
import enTranslation from './locales/en.json'
import esTranslation from './locales/es.json'

// Import table data translations (separate namespace)
import enTables from './locales/tables-en.json'
import esTables from './locales/tables-es.json'

// Import GM reference tables translations (separate namespace)
import enGMTables from './locales/gmtables-en.json'
import esGMTables from './locales/gmtables-es.json'

// Configure i18next
i18n.use(initReactI18next) // Initialize react-i18next
    .init({
        resources: {
            en: {
                translation: enTranslation,
                tables: enTables,
                gmtables: enGMTables,
            },
            es: {
                translation: esTranslation,
                tables: esTables,
                gmtables: esGMTables,
            },
        },
        lng: 'en', // Default language, will be overridden by user preference on load
        fallbackLng: 'en',
        defaultNS: 'translation',
        ns: ['translation', 'tables', 'gmtables'],
        //debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false, // React already escapes values
        },
    })

export default i18n
