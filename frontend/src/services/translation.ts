// Translation service for multilingual TTS support

export interface Language {
  code: string;
  name: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල' },
];

// Common emergency phrases in different languages
const EMERGENCY_PHRASES: Record<string, Record<string, string>> = {
  'en': {
    'emergency': 'Emergency',
    'warning': 'Warning',
    'alert': 'Alert',
    'evacuate': 'Please evacuate immediately',
    'danger': 'Danger',
    'safe': 'All clear',
    'weather': 'Weather warning',
    'flood': 'Flood warning',
    'fire': 'Fire emergency',
    'earthquake': 'Earthquake warning',
  },
  'hi': {
    'emergency': 'आपातकाल',
    'warning': 'चेतावनी',
    'alert': 'सतर्कता',
    'evacuate': 'कृपया तुरंत खाली जाएं',
    'danger': 'खतरा',
    'safe': 'सब सुरक्षित',
    'weather': 'मौसम चेतावनी',
    'flood': 'बाढ़ चेतावनी',
    'fire': 'आग आपातकाल',
    'earthquake': 'भूकंप चेतावनी',
  },
  'bn': {
    'emergency': 'জরুরি',
    'warning': 'সতর্কতা',
    'alert': 'সতর্কতা',
    'evacuate': 'অনুগ্রহ করে অবিলম্বে সরিয়ে যান',
    'danger': 'বিপদ',
    'safe': 'সব নিরাপদ',
    'weather': 'আবহাওয়া সতর্কতা',
    'flood': 'বন্যা সতর্কতা',
    'fire': 'অগ্নিকাণ্ড জরুরি',
    'earthquake': 'ভূমিকম্প সতর্কতা',
  },
  'te': {
    'emergency': 'అత్యవసర',
    'warning': 'హెచ్చరిక',
    'alert': 'హెచ్చరిక',
    'evacuate': 'దయచేసి వెంటనే తప్పుకోండి',
    'danger': 'ప్రమాదం',
    'safe': 'అన్నీ సురక్షితం',
    'weather': 'వాతావరణ హెచ్చరిక',
    'flood': 'వరద హెచ్చరిక',
    'fire': 'అగ్ని అత్యవసర',
    'earthquake': 'భూకంప హెచ్చరిక',
  },
  'ta': {
    'emergency': 'அவசர',
    'warning': 'எச்சரிக்கை',
    'alert': 'எச்சரிக்கை',
    'evacuate': 'தயவுசெய்து உடனடியாக வெளியேறுங்கள்',
    'danger': 'ஆபத்து',
    'safe': 'அனைத்தும் பாதுகாப்பானது',
    'weather': 'வானிலை எச்சரிக்கை',
    'flood': 'வெள்ள எச்சரிக்கை',
    'fire': 'தீ அவசர',
    'earthquake': 'நிலநடுக்க எச்சரிக்கை',
  },
  'mr': {
    'emergency': 'आणीबाणी',
    'warning': 'चेतावनी',
    'alert': 'सतर्कता',
    'evacuate': 'कृपया लगेच बाहेर पडा',
    'danger': 'धोका',
    'safe': 'सर्व सुरक्षित',
    'weather': 'हवामान चेतावनी',
    'flood': 'पूर चेतावनी',
    'fire': 'आग आणीबाणी',
    'earthquake': 'भूकंप चेतावनी',
  },
  'gu': {
    'emergency': 'કટોકટી',
    'warning': 'ચેતવણી',
    'alert': 'સાવધાન',
    'evacuate': 'કૃપા કરી તરત જ બહાર નીકળો',
    'danger': 'ભય',
    'safe': 'બધું સુરક્ષિત',
    'weather': 'હવામાન ચેતવણી',
    'flood': 'પૂર ચેતવણી',
    'fire': 'આગ કટોકટી',
    'earthquake': 'ધરતીકંપ ચેતવણી',
  },
  'kn': {
    'emergency': 'ತ ುರ್ತು',
    'warning': 'ಎಚ್ಚರಿಕೆ',
    'alert': 'ಎಚ್ಚರಿಕೆ',
    'evacuate': 'ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ಹೊರಗೆ ಹೋಗಿ',
    'danger': 'ಅಪಾಯ',
    'safe': 'ಎಲ್ಲಾ ಸುರಕ್ಷಿತ',
    'weather': 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ',
    'flood': 'ವೈಪತ್ತು ಎಚ್ಚರಿಕೆ',
    'fire': 'ಅಗ್ನಿ ತುರ್ತು',
    'earthquake': 'ಭೂಕಂಪ ಎಚ್ಚರಿಕೆ',
  },
  'ml': {
    'emergency': 'അടിയന്തിര',
    'warning': 'മുന്നറിയിപ്പ്',
    'alert': 'മുന്നറിയിപ്പ്',
    'evacuate': 'ദയവായി ഉടൻ തന്നെ പുറത്ത് പോകുക',
    'danger': 'അപകടം',
    'safe': 'എല്ലാം സുരക്ഷിതം',
    'weather': 'കാലാവസ്ഥ മുന്നറിയിപ്പ്',
    'flood': 'വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ്',
    'fire': 'തീ അടിയന്തിര',
    'earthquake': 'ഭൂകമ്പ മുന്നറിയിപ്പ്',
  },
  'pa': {
    'emergency': 'ਤਾਕੀਦੀ',
    'warning': 'ਚੇਤਾਵਨੀ',
    'alert': 'ਸਾਵਧਾਨ',
    'evacuate': 'ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਬਾਹਰ ਜਾਓ',
    'danger': 'ਖ਼ਤਰਾ',
    'safe': 'ਸਭ ਸੁਰੱਖਿਅਤ',
    'weather': 'ਮੌਸਮ ਚੇਤਾਵਨੀ',
    'flood': 'ਹੜ੍ਹ ਚੇਤਾਵਨੀ',
    'fire': 'ਅੱਗ ਤਾਕੀਦੀ',
    'earthquake': 'ਭੂਚਾਲ ਚੇਤਾਵਨੀ',
  },
  'ur': {
    'emergency': 'ہنگامی',
    'warning': 'انتباہ',
    'alert': 'انتباہ',
    'evacuate': 'براہ کرم فوراً باہر نکلیں',
    'danger': 'خطرہ',
    'safe': 'سب محفوظ',
    'weather': 'موسم انتباہ',
    'flood': 'سیلاب انتباہ',
    'fire': 'آگ ہنگامی',
    'earthquake': 'زلزلہ انتباہ',
  },
  'or': {
    'emergency': 'ଜରୁରୀ',
    'warning': 'ସତର୍କତା',
    'alert': 'ସତର୍କତା',
    'evacuate': 'ଦୟାକରି ତୁରନ୍ତ ବାହାରକୁ ଯାଆନ୍ତୁ',
    'danger': 'ବିପଦ',
    'safe': 'ସବୁ ସୁରକ୍ଷିତ',
    'weather': 'ପାଣିପାଗ ସତର୍କତା',
    'flood': 'ବନ୍ୟା ସତର୍କତା',
    'fire': 'ଅଗ୍ନି ଜରୁରୀ',
    'earthquake': 'ଭୂମିକମ୍ପ ସତର୍କତା',
  },
  'as': {
    'emergency': 'জৰুৰী',
    'warning': 'সতর্কতা',
    'alert': 'সতর্কতা',
    'evacuate': 'অনুগ্ৰহ কৰি তৎক্ষণাত বাহিৰলৈ যাওক',
    'danger': 'বিপদ',
    'safe': 'সকলো সুৰক্ষিত',
    'weather': 'বতৰ সতর্কতা',
    'flood': 'পানী বান সতর্কতা',
    'fire': 'জুই জৰুৰী',
    'earthquake': 'ভূমিকম্প সতর্কতা',
  },
  'ne': {
    'emergency': 'आकस्मिक',
    'warning': 'चेतावनी',
    'alert': 'सावधान',
    'evacuate': 'कृपया तुरुन्तै बाहिर जानुहोस्',
    'danger': 'खतरा',
    'safe': 'सबै सुरक्षित',
    'weather': 'मौसम चेतावनी',
    'flood': 'बाढी चेतावनी',
    'fire': 'आगो आकस्मिक',
    'earthquake': 'भूकम्प चेतावनी',
  },
  'si': {
    'emergency': 'හදිසි',
    'warning': 'අනතුරු ඇඟවීම',
    'alert': 'අනතුරු ඇඟවීම',
    'evacuate': 'කරුණාකර වහාම පිටතට යන්න',
    'danger': 'අවදානම',
    'safe': 'සියල්ල ආරක්ෂිතයි',
    'weather': 'කාලගුණ අනතුරු ඇඟවීම',
    'flood': 'ගංවතුර අනතුරු ඇඟවීම',
    'fire': 'ගින්න හදිසි',
    'earthquake': 'භූමිකම්පා අනතුරු ඇඟවීම',
  },
};

export class TranslationService {
  private static instance: TranslationService;
  private cache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Get emergency phrase in specified language
   */
  public getEmergencyPhrase(phrase: string, language: string): string {
    const langPhrases = EMERGENCY_PHRASES[language];
    if (langPhrases && langPhrases[phrase]) {
      return langPhrases[phrase];
    }
    // Fallback to English
    return EMERGENCY_PHRASES['en'][phrase] || phrase;
  }

  /**
   * Translate text using external API (simulated for demo)
   */
  public async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text || targetLanguage === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // For demo purposes, we'll use a simple translation mapping
      // In production, you'd use a real translation API like Google Translate
      const translations: Record<string, string> = {
        'hi': 'आपातकालीन चेतावनी',
        'bn': 'জরুরি সতর্কতা',
        'te': 'అత్యవసర హెచ్చరిక',
        'ta': 'அவசர எச்சரிக்கை',
        'mr': 'आणीबाणीची चेतावनी',
        'gu': 'કટોકટીની ચેતવણી',
        'kn': 'ತುರ್ತು ಎಚ್ಚರಿಕೆ',
        'ml': 'അടിയന്തിര മുന്നറിയിപ്പ്',
        'pa': 'ਜ਼ਰੂਰੀ ਚੇਤਾਵਨੀ',
        'ur': 'ہنگامی انتباہ',
        'or': 'ଜରୁରୀ ସତର୍କତା',
        'as': 'জৰুৰী সতর্কতা',
        'ne': 'आकस्मिक चेतावनी',
        'si': 'හදිසි අනතුරු ඇඟවීම',
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const translated = translations[targetLanguage] || text;
      
      // Cache the result
      this.cache.set(cacheKey, translated);
      
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Get language by code
   */
  public getLanguageByCode(code: string): Language | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Check if language is supported
   */
  public isLanguageSupported(code: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
  }

  /**
   * Clear translation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export default TranslationService;
