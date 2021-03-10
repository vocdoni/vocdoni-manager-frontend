import i18next from 'i18next'
import moment from 'moment'
import { ca, en, eo, es } from './locales'

const i18n = i18next.createInstance()

moment.locale(process.env.LANG)

i18n.init({
    debug: process.env.NODE_ENV === 'development',
    lng: process.env.LANG,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
        escapeValue: false,
    },
    returnEmptyString: false,
})

i18n.addResourceBundle('ca', 'translation', ca)
i18n.addResourceBundle('en', 'translation', en)
i18n.addResourceBundle('eo', 'translation', eo)
i18n.addResourceBundle('es', 'translation', es)

export default i18n
