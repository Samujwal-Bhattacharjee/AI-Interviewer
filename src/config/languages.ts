/**
 * languages.ts — Centralized language configuration for Indian languages + English.
 */

export interface LanguageConfig {
  code: string;
  shortCode: string;
  displayTag: string;
  name: string;
  nativeName: string;
  native: string; // compatibility alias
  flag?: string;
}

export const INDIAN_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en-IN',
    shortCode: 'EN',
    displayTag: '🌐',
    name: 'English',
    nativeName: 'English',
    native: 'English',
    flag: '🌐',
  },
  {
    code: 'hi-IN',
    shortCode: 'HI',
    displayTag: 'IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    native: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'ta-IN',
    shortCode: 'TA',
    displayTag: 'TA',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    native: 'தமிழ்',
  },
  {
    code: 'bn-IN',
    shortCode: 'BN',
    displayTag: 'BN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    native: 'বাংলা',
  },
  {
    code: 'gu-IN',
    shortCode: 'GU',
    displayTag: 'GU',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    native: 'ગુજરાતી',
  },
  {
    code: 'te-IN',
    shortCode: 'TE',
    displayTag: 'TE',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    native: 'తెలుగు',
  },
  {
    code: 'kn-IN',
    shortCode: 'KN',
    displayTag: 'KN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    native: 'ಕನ್ನಡ',
  },
];

export const DEFAULT_LANGUAGE_CODE = 'hi-IN';

export function getLanguageByCode(code: string): LanguageConfig {
  return (
    INDIAN_LANGUAGES.find((lang) => lang.code === code) ||
    INDIAN_LANGUAGES.find((lang) => lang.code === 'hi-IN') ||
    INDIAN_LANGUAGES[0]
  );
}

// Supported Indian languages for Mode 2 answer detection
export const MODE_2_SUPPORTED_LANGUAGES = INDIAN_LANGUAGES.filter(
  (lang) => lang.code !== 'en-IN'
);
