export const SCAM_TYPES = {
  kyc_bank: {
    id: 'kyc_bank',
    name: 'Bank KYC Scam',
    name_hi: 'बैंक केवाईसी धोखा',
    name_kn: 'ಬ್ಯಾಂಕ್ ಕೆವೈಸಿ ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  job_task: {
    id: 'job_task',
    name: 'Part-Time Job / Task Scam',
    name_hi: 'पार्ट-टाइम जॉब / टास्क धोखा',
    name_kn: 'ಪಾರ್ಟ್-ಟೈಮ್ ಉದ್ಯೋಗ / ಟಾಸ್ಕ್ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  digital_arrest: {
    id: 'digital_arrest',
    name: 'Digital Arrest / Fake Police',
    name_hi: 'डिजिटल अरेस्ट / फर्जी पुलिस',
    name_kn: 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ / ನಕಲಿ ಪೊಲೀಸ್',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  lottery_prize: {
    id: 'lottery_prize',
    name: 'Lottery / Fake Prize Scam',
    name_hi: 'लॉटरी / फर्जी इनाम धोखा',
    name_kn: 'ಲಾಟರಿ / ನಕಲಿ ಬಹುಮಾನ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  investment_trading: {
    id: 'investment_trading',
    name: 'Investment / Trading Scam',
    name_hi: 'निवेश / ट्रेडिंग धोखा',
    name_kn: 'ಹೂಡಿಕೆ / ಟ್ರೇಡಿಂಗ್ ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  upi_payment_request: {
    id: 'upi_payment_request',
    name: 'UPI Payment Request Scam',
    name_hi: 'यूपीआई पेमेंट रिक्वेस्ट धोखा',
    name_kn: 'ಯುಪಿಐ ಪಾವತಿ ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  delivery_courier: {
    id: 'delivery_courier',
    name: 'Delivery / Customs Courier Scam',
    name_hi: 'कस्टम्स / कूरियर पार्सल धोखा',
    name_kn: 'ಕಸ್ಟಮ್ಸ್ / ಕೊರಿಯರ್ ಪಾರ್ಸೆಲ್ ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  loan_app: {
    id: 'loan_app',
    name: 'Predatory Loan App Scam',
    name_hi: 'फर्जी लोन ऐप उत्पीड़न',
    name_kn: 'ನಕಲಿ ಸಾಲದ ಆ್ಯಪ್ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  electricity_bill: {
    id: 'electricity_bill',
    name: 'Electricity Bill Scam',
    name_hi: 'बिजली बिल केवाईसी धोखा',
    name_kn: 'ವಿದ್ಯುತ್ ಬಿಲ್ ಕೆವೈಸಿ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  impersonation: {
    id: 'impersonation',
    name: 'Impersonation Scam',
    name_hi: 'बहरूपिया / पहचान की चोरी धोखा',
    name_kn: 'ನಕಲಿ ಗುರುತು ವಂಚನೆ',
    severity: 'high',
    color: 'bg-rose-100 text-rose-900 border-rose-300'
  },
  phishing_link: {
    id: 'phishing_link',
    name: 'Phishing Link Scam',
    name_hi: 'फर्जी लिंक (फ़िशिंग) धोखा',
    name_kn: 'ನಕಲಿ ಲಿಂಕ್ (ಫಿಶಿಂಗ್) ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  sextortion: {
    id: 'sextortion',
    name: 'Sextortion / Video Call Blackmail',
    name_hi: 'वीडियो कॉल ब्लैकमेल / सेक्सटॉर्शन',
    name_kn: 'ವಿಡಿಯೋ ಕಾಲ್ ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್',
    severity: 'critical',
    color: 'bg-rose-100 text-rose-900 border-rose-300'
  },
  other: {
    id: 'other',
    name: 'Other Scam',
    name_hi: 'अन्य साइबर धोखाधड़ी',
    name_kn: 'ಇತರ ಸೈಬರ್ ವಂಚನೆ',
    severity: 'medium',
    color: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  none: {
    id: 'none',
    name: 'Looks Safe / No Scam',
    name_hi: 'सुरक्षित संदेश / सामान्य',
    name_kn: 'ಸುರಕ್ಷಿತ ಸಂದೇಶ / ಸಾಮಾನ್ಯ',
    severity: 'safe',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  // Legacy / Mock Aliases
  bank_kyc: {
    id: 'bank_kyc',
    name: 'Bank KYC Scam',
    name_hi: 'बैंक केवाईसी धोखा',
    name_kn: 'ಬ್ಯಾಂಕ್ ಕೆವೈಸಿ ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  part_time_job: {
    id: 'part_time_job',
    name: 'Part-Time Job / Task Scam',
    name_hi: 'पार्ट-टाइम जॉब / टास्क धोखा',
    name_kn: 'ಪಾರ್ಟ್-ಟೈಮ್ ಉದ್ಯೋಗ / ಟಾಸ್ಕ್ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  customs_courier: {
    id: 'customs_courier',
    name: 'Delivery / Customs Courier Scam',
    name_hi: 'कस्टम्स / कूरियर पार्सल धोखा',
    name_kn: 'ಕಸ್ಟಮ್ಸ್ / ಕೊರಿಯರ್ ಪಾರ್ಸೆಲ್ ವಂಚನೆ',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  lottery_kbc: {
    id: 'lottery_kbc',
    name: 'Lottery / Fake Prize Scam',
    name_hi: 'लॉटरी / फर्जी इनाम धोखा',
    name_kn: 'ಲಾಟರಿ / ನಕಲಿ ಬಹುಮಾನ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  safe_message: {
    id: 'safe_message',
    name: 'Looks Safe / No Scam',
    name_hi: 'सुरक्षित संदेश / सामान्य',
    name_kn: 'ಸುರಕ್ಷಿತ ಸಂದೇಶ / ಸಾಮಾನ್ಯ',
    severity: 'safe',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
};

export function getScamTypeLabel(scamType, lang = 'en') {
  if (!scamType) return 'Unclassified';
  const match = SCAM_TYPES[scamType] || Object.values(SCAM_TYPES).find(t => t.name.toLowerCase() === String(scamType).toLowerCase());
  if (!match) {
    // Format camelCase or snake_case nicely
    return String(scamType).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  if (lang === 'hi' && match.name_hi) return match.name_hi;
  if (lang === 'kn' && match.name_kn) return match.name_kn;
  return match.name;
}

export function getScamTypeBadgeClass(scamType) {
  const match = SCAM_TYPES[scamType];
  return match?.color || 'bg-slate-100 text-slate-800 border-slate-300';
}
