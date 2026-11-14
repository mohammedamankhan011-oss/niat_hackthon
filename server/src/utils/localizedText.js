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
    communityFlag: 'Reported by other users',
    communityExplanation: (what, count) =>
      `This ${what} has been reported ${count} times as a scam by ScamShield users.`,
    identifierNames: { phone: 'phone number', upi: 'UPI ID', url: 'link' },
    liveScamAdvice: 'This call looks like a scam. Do not share any OTP, PIN or money. Hang up now.',
    liveSuspiciousAdvice: 'Be careful. Do not share any OTP, PIN or bank details on this call.',
    liveSafeAdvice: 'Nothing worrying so far. Keep listening carefully.',
    liveScamSayThis: 'I will verify this myself at the official office. Please do not call me again.',
    liveSafeSayThis: 'Can you please tell me your full name and which office you are calling from?',
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
    communityFlag: 'दूसरे यूज़र्स ने रिपोर्ट किया',
    communityExplanation: (what, count) =>
      `इस ${what} को ScamShield यूज़र्स ने ${count} बार धोखाधड़ी के रूप में रिपोर्ट किया है।`,
    identifierNames: { phone: 'फ़ोन नंबर', upi: 'UPI ID', url: 'लिंक' },
    liveScamAdvice: 'यह कॉल धोखाधड़ी लगती है। कोई OTP, PIN या पैसा न दें। अभी कॉल काट दें।',
    liveSuspiciousAdvice: 'सावधान रहें। इस कॉल पर कोई OTP, PIN या बैंक की जानकारी न दें।',
    liveSafeAdvice: 'अभी तक कुछ चिंता की बात नहीं है। ध्यान से सुनते रहें।',
    liveScamSayThis: 'मैं खुद आधिकारिक दफ़्तर जाकर इसकी जाँच करूँगा। कृपया मुझे दोबारा कॉल न करें।',
    liveSafeSayThis: 'कृपया अपना पूरा नाम बताइए और आप किस दफ़्तर से बोल रहे हैं?',
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
    communityFlag: 'ಇತರ ಬಳಕೆದಾರರು ವರದಿ ಮಾಡಿದ್ದಾರೆ',
    communityExplanation: (what, count) =>
      `ಈ ${what} ಅನ್ನು ScamShield ಬಳಕೆದಾರರು ${count} ಬಾರಿ ವಂಚನೆ ಎಂದು ವರದಿ ಮಾಡಿದ್ದಾರೆ.`,
    identifierNames: { phone: 'ಫೋನ್ ನಂಬರ್', upi: 'UPI ID', url: 'ಲಿಂಕ್' },
    liveScamAdvice: 'ಈ ಕರೆ ವಂಚನೆಯಂತೆ ಕಾಣುತ್ತದೆ. ಯಾವುದೇ OTP, PIN ಅಥವಾ ಹಣ ನೀಡಬೇಡಿ. ಈಗಲೇ ಕರೆ ಕಟ್ ಮಾಡಿ.',
    liveSuspiciousAdvice: 'ಎಚ್ಚರವಾಗಿರಿ. ಈ ಕರೆಯಲ್ಲಿ ಯಾವುದೇ OTP, PIN ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.',
    liveSafeAdvice: 'ಇಲ್ಲಿಯವರೆಗೆ ಆತಂಕಪಡುವಂಥದ್ದು ಏನೂ ಇಲ್ಲ. ಗಮನವಿಟ್ಟು ಕೇಳುತ್ತಿರಿ.',
    liveScamSayThis: 'ನಾನೇ ಅಧಿಕೃತ ಕಚೇರಿಗೆ ಹೋಗಿ ಪರಿಶೀಲಿಸುತ್ತೇನೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಕರೆ ಮಾಡಬೇಡಿ.',
    liveSafeSayThis: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಮತ್ತು ಯಾವ ಕಚೇರಿಯಿಂದ ಕರೆ ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ತಿಳಿಸಿ.',
  },
};

export function localized(language, key) {
  return (TEXT[language] ?? TEXT.en)[key];
}
