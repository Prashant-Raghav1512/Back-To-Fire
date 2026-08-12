export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
}

// All 22 languages in the Eighth Schedule of the Indian Constitution -
// India's own list of officially recognized languages, not a translator's
// arbitrary pick. Between them these are the principal language of
// virtually every state (Telugu for Andhra Pradesh/Telangana, Kannada for
// Karnataka, Tamil for Tamil Nadu, Bengali for West Bengal, Marathi for
// Maharashtra, Hindi across most of the Hindi Belt, and so on) - used by
// src/lib/articleTranslate.ts and ArticleModal.tsx's language picker.
// Deliberately excludes any non-Indian language.
export const indianLanguages: IndianLanguage[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', nativeName: 'सिन्धी' },
];
