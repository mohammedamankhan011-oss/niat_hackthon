// Fixed, human-written strings used when the AI output is missing something
// essential, so users always get safe guidance in their own language.

const TEXT = {
  en: {
    scamActions: [
      'Do not click any link or open any attachment in this message.',
      'Never share your OTP, PIN, password or card details with anyone.',
      'Block and report the sender.',
      'If you lost money, call 1930 (National Cyber Crime Helpline) immediately.',
      'Report it at cybercrime.gov.in.',
    ],
    safeAction: 'This looks safe, but still verify it on the official app or website before acting.',
    unreadableImage:
      'We could not read a message in this image. Please upload a clear screenshot of the message or paste the text instead.',
  },
  hi: {
    scamActions: [
      'इस संदेश में दिए गए किसी भी लिंक पर क्लिक न करें और कोई अटैचमेंट न खोलें।',
      'अपना OTP, PIN, पासवर्ड या कार्ड की जानकारी किसी के साथ साझा न करें।',
      'भेजने वाले को ब्लॉक करें और रिपोर्ट करें।',
      'अगर पैसे कट गए हैं, तो तुरंत 1930 (राष्ट्रीय साइबर क्राइम हेल्पलाइन) पर कॉल करें।',
      'cybercrime.gov.in पर शिकायत दर्ज करें।',
    ],
    safeAction: 'यह सुरक्षित लगता है, फिर भी कुछ भी करने से पहले आधिकारिक ऐप या वेबसाइट पर जाँच लें।',
    unreadableImage:
      'इस तस्वीर में हमें कोई संदेश पढ़ने में नहीं आया। कृपया संदेश का साफ़ स्क्रीनशॉट अपलोड करें या टेक्स्ट पेस्ट करें।',
  },
  kn: {
    scamActions: [
      'ಈ ಸಂದೇಶದಲ್ಲಿರುವ ಯಾವುದೇ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ ಮತ್ತು ಯಾವುದೇ ಅಟ್ಯಾಚ್‌ಮೆಂಟ್ ತೆರೆಯಬೇಡಿ.',
      'ನಿಮ್ಮ OTP, PIN, ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಕಾರ್ಡ್ ವಿವರಗಳನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.',
      'ಕಳುಹಿಸಿದವರನ್ನು ಬ್ಲಾಕ್ ಮಾಡಿ ಮತ್ತು ರಿಪೋರ್ಟ್ ಮಾಡಿ.',
      'ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದರೆ, ತಕ್ಷಣ 1930 (ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಅಪರಾಧ ಸಹಾಯವಾಣಿ) ಗೆ ಕರೆ ಮಾಡಿ.',
      'cybercrime.gov.in ನಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ.',
    ],
    safeAction: 'ಇದು ಸುರಕ್ಷಿತವಾಗಿ ಕಾಣುತ್ತದೆ, ಆದರೂ ಏನಾದರೂ ಮಾಡುವ ಮೊದಲು ಅಧಿಕೃತ ಆ್ಯಪ್ ಅಥವಾ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    unreadableImage:
      'ಈ ಚಿತ್ರದಲ್ಲಿ ಯಾವುದೇ ಸಂದೇಶವನ್ನು ಓದಲು ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಂದೇಶದ ಸ್ಪಷ್ಟ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಪಠ್ಯವನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ.',
  },
};

export function localized(language, key) {
  return (TEXT[language] ?? TEXT.en)[key];
}
