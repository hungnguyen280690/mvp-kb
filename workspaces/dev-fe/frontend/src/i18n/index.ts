// ============================================================================
// i18next configuration — Vietnamese first
// ============================================================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi';

i18n.use(initReactI18next).init({
  resources: {
    vi,
  },
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
  ns: ['translation'],
  defaultNS: 'translation',
});

export default i18n;
