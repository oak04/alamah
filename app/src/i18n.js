import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './app/main/example/i18n/en.json';
import ar from './app/main/example/i18n/ar.json';
// the translations
// (tip move them in a JSON file and import them)
export const getLang = () => localStorage.getItem('locale') || 'en';
const locale = getLang() || 'en';
export const setLang = lang => localStorage.setItem('locale', lang);

export const changeLang = switchedLang => {
	if (switchedLang !== getLang()) {
		setLang(switchedLang);
		i18n.changeLanguage(switchedLang);
		i18n.reloadResources();
	}
};
// changeLang(locale);

const resources = {
	en: {
		translation: {
			...en
		}
	},
	ar: {
		translation: {
			...ar
		}
	}
};

i18n.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources,
		lng: locale,
		keySeparator: '.', // we do not use keys in form messages.welcome
		interpolation: {
			escapeValue: false // react already safes from xss
		}
	});

export default i18n;
