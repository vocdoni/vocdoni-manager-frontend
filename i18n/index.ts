import i18next from 'i18next'
import moment from 'moment'
import manager from './locales'
import backup from './backup'

const i18n = i18next.createInstance()

export const supportedLanguages = ['ca', 'en', 'eo', 'es']

moment.locale(process.env.LANG)

i18n.init({
    debug: process.env.NODE_ENV === 'development',
    lng: process.env.LANG,
    fallbackLng: 'en',
    defaultNS: 'manager',
    ns: ['manager', 'backup'],
    interpolation: {
        escapeValue: false,
    },
    returnEmptyString: false,
})

for (const lang of supportedLanguages) {
    if (typeof manager[lang] !== 'undefined') {
        i18n.addResourceBundle(lang, 'manager', manager[lang])
    }

    if (typeof backup[lang] !== 'undefined') {
        i18n.addResourceBundle(lang, 'backup', backup[lang])
    }
}

export default i18n
