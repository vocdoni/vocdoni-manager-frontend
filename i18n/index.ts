import i18next from 'i18next'
import { en, ca } from './locales'

const i18n = i18next.createInstance()

i18n.init({
    debug: process.env.NODE_ENV === 'development',
    lng: process.env.LANG,
    fallbackLng: 'en',
    defaultNS: 'translation',
})

i18n.addResourceBundle('en', 'translation', en)
i18n.addResourceBundle('ca', 'translation', ca)

export default i18n
