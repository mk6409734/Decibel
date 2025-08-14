# Multilingual TTS System for Decibel Siren Control

## Overview

The Decibel system now supports comprehensive multilingual Text-to-Speech (TTS) capabilities for emergency alerts and notifications. This system allows users to create alerts in English and automatically translate and convert them to speech in multiple Indian languages and other supported languages.

## Features

### 🌍 Supported Languages
- **English** (en) - Base language
- **Hindi** (hi) - हिंदी
- **Bengali** (bn) - বাংলা
- **Telugu** (te) - తెలుగు
- **Tamil** (ta) - தமிழ்
- **Marathi** (mr) - मराठी
- **Gujarati** (gu) - ગુજરાતી
- **Kannada** (kn) - ಕನ್ನಡ
- **Malayalam** (ml) - മലയാളം
- **Punjabi** (pa) - ਪੰਜਾਬੀ
- **Urdu** (ur) - اردو
- **Odia** (or) - ଓଡ଼ିଆ
- **Assamese** (as) - অসমীয়া
- **Nepali** (ne) - नेपाली
- **Sinhala** (si) - සිංහල

### 🎯 Key Features
- **Real-time Translation**: Automatic translation from English to target languages
- **Text Normalization**: Optimized text processing for better TTS quality
- **Audio Merging**: Combines alert sounds with translated speech
- **Fallback Support**: Graceful degradation when translation fails
- **Caching**: Translation caching for improved performance
- **Emergency Phrases**: Pre-built emergency phrases in all supported languages

## Architecture

### Frontend Components

#### 1. SirenControlDialog (`frontend/src/components/SirenControlDialog.tsx`)
- Enhanced UI with language selection dropdown
- Real-time translation preview
- Support for 15+ languages with native script display
- Translation status indicators

#### 2. Translation Service (`frontend/src/services/translation.ts`)
- Singleton service for translation management
- Emergency phrase library
- Translation caching
- Language validation and support checking

### Backend Components

#### 1. Enhanced Python Siren Code (`siren-code/code.py`)
- **Text Normalization**: Cleans and standardizes text for better TTS
- **Multi-language TTS**: Generates audio in both English and target language
- **Audio Processing**: Merges alert sounds with speech using pydub
- **Error Handling**: Robust fallback mechanisms

#### 2. Key Functions

```python
def normalize_text_for_tts(text: str) -> str:
    """Normalize text for better TTS performance"""
    # Handles abbreviations, symbols, numbers
    # Improves pronunciation quality

def translate_text(text: str, target_language: str) -> str:
    """Translate text using Google Translate API"""
    # Supports all 15+ languages
    # Includes fallback handling

def generate_tts_audio(text: str, language: str, output_file: str) -> bool:
    """Generate TTS audio using gTTS"""
    # Creates high-quality speech files
    # Validates output quality
```

## Usage

### 1. Creating Multilingual Alerts

1. **Open Siren Control Dialog**
   - Click on any siren in the SirenList
   - Select the "Test Siren" button

2. **Configure Alert Settings**
   - Choose communication medium (Cellular, Ethernet, VSAT)
   - Select alarm type (Warning, Air Raid, Nuclear, Navy)
   - Set frequency and gap settings

3. **Select Target Language**
   - Use the language dropdown to select from 15+ languages
   - Each language shows native script and English name

4. **Enter Message**
   - Type your message in English
   - The system automatically translates and shows preview
   - Translation happens in real-time

5. **Send Alert**
   - Click "Send Message" to broadcast
   - System generates TTS in both English and target language
   - Audio plays: Alert Sound → English Speech → Target Language Speech

### 2. Emergency Phrases

The system includes pre-built emergency phrases:

```typescript
// Available phrases
'emergency', 'warning', 'alert', 'evacuate', 'danger', 
'safe', 'weather', 'flood', 'fire', 'earthquake'
```

Example usage:
```typescript
const translationService = TranslationService.getInstance();
const phrase = translationService.getEmergencyPhrase('evacuate', 'hi');
// Returns: "कृपया तुरंत खाली जाएं"
```

## Technical Implementation

### Text Processing Pipeline

1. **Input**: English text from user
2. **Normalization**: Clean and standardize text
3. **Translation**: Convert to target language
4. **TTS Generation**: Create audio files
5. **Audio Merging**: Combine with alert sounds
6. **Playback**: Broadcast through siren system

### Audio Flow

```
Alert Sound → English TTS → [Gap] → Target Language TTS → [Repeat]
```

### Error Handling

- **Translation Failure**: Falls back to English
- **TTS Generation Failure**: Uses English audio only
- **Network Issues**: Continues with cached translations
- **Audio Processing Errors**: Graceful degradation

## Configuration

### Frontend Configuration

```typescript
// Language selection
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  // ... more languages
];

// Translation service
const translationService = TranslationService.getInstance();
```

### Backend Configuration

```python
# Supported languages mapping
SUPPORTED_LANGUAGES = {
    'en': 'en',
    'hi': 'hi',
    'bn': 'bn',
    # ... more languages
}

# Audio settings
gap_in_audio = 2  # seconds between audio segments
frequency = 3     # number of repetitions
```

## Performance Optimizations

### 1. Translation Caching
- Caches translations to avoid repeated API calls
- Improves response time for common phrases
- Reduces API costs

### 2. Text Normalization
- Pre-processes text for better TTS quality
- Handles abbreviations and symbols
- Improves pronunciation accuracy

### 3. Audio Processing
- Efficient audio merging using pydub
- Optimized file handling
- Memory-efficient processing

## Dependencies

### Frontend
```json
{
  "dependencies": {
    "sonner": "^1.0.0"  // For toast notifications
  }
}
```

### Backend (Python)
```txt
gtts==2.3.2              # Google Text-to-Speech
google-trans-new==1.1.9  # Google Translate
pydub==0.25.1            # Audio processing
pygame==2.5.2            # Audio playback
```

## API Integration

### Translation APIs
Currently using Google Translate API through `google-trans-new`:
- Free tier available
- Supports all target languages
- Reliable and accurate

### TTS APIs
Using Google Text-to-Speech (gTTS):
- High-quality speech synthesis
- Natural-sounding voices
- Supports all target languages

## Future Enhancements

### 1. Advanced Translation
- Integration with multiple translation services
- Context-aware translation
- Custom translation models

### 2. Voice Customization
- Multiple voice options per language
- Gender selection
- Speed and pitch control

### 3. Offline Support
- Local translation models
- Offline TTS capabilities
- Reduced dependency on internet

### 4. Analytics
- Translation accuracy metrics
- Usage statistics
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Translation Not Working**
   - Check internet connectivity
   - Verify API quotas
   - Check language code validity

2. **TTS Audio Issues**
   - Verify audio device connection
   - Check file permissions
   - Ensure sufficient disk space

3. **Audio Playback Problems**
   - Test audio system initialization
   - Check USB audio device connection
   - Verify pygame installation

### Debug Mode

Enable detailed logging:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Security Considerations

1. **API Key Management**
   - Store translation API keys securely
   - Use environment variables
   - Implement rate limiting

2. **Input Validation**
   - Sanitize user input
   - Validate language codes
   - Prevent injection attacks

3. **Audio File Security**
   - Validate audio file integrity
   - Secure file storage
   - Access control for audio files

## Contributing

To add support for new languages:

1. **Update Language Lists**
   - Add to `SUPPORTED_LANGUAGES` in both frontend and backend
   - Include native script and English names

2. **Add Emergency Phrases**
   - Update `EMERGENCY_PHRASES` in translation service
   - Provide accurate translations

3. **Test TTS Quality**
   - Verify gTTS supports the language
   - Test audio generation and playback
   - Validate pronunciation quality

## License

This multilingual TTS system is part of the Decibel project and follows the same licensing terms.

---

For technical support or questions about the multilingual TTS system, please refer to the main project documentation or contact the development team.
