import { getScamTypeLabel } from './scamTypeLabels.js';
import { t as translate } from './translations.js';

export const COMPLAINT_UI_TEXT = {
  en: {
    panelTitle: 'Ready-Made Cybercrime Complaint (1930 / cybercrime.gov.in)',
    panelSubtitle: 'Review, copy, and paste this pre-filled complaint directly on the National Cyber Crime Portal or share with your family.',
    dateLabel: 'Date & Time',
    scamTypeLabel: 'Scam Type',
    whatHappenedLabel: 'What Happened (2–3 Line Summary)',
    identifiersLabel: "Scammer's Phone Numbers / UPI IDs / Links",
    phonesLabel: 'Phone Numbers',
    upiLabel: 'UPI IDs',
    urlsLabel: 'Links / URLs',
    noneFound: 'None detected in message',
    redFlagsLabel: 'Red Flags Identified',
    paymentStatusLabel: 'OTP & Payment Status',
    noLossLine: 'I did not share any OTP or make any payment',
    lostMoneyPrefix: 'I lost money: Rs',
    checkboxLabel: 'Change to "I lost money: Rs ____"',
    amountPlaceholder: 'Enter amount (e.g. 5000)',
    complaintPreviewLabel: 'Full Ready-to-Copy Cybercrime Complaint',
    inputTypeMap: {
      call: 'phone call',
      image: 'screenshot / message',
      text: 'SMS / WhatsApp message'
    },
    whatsappHeader: '🚨 Family Scam Alert from ScamShield!'
  },
  hi: {
    panelTitle: 'तैयार साइबर क्राइम शिकायत प्रारूप (1930 / cybercrime.gov.in)',
    panelSubtitle: 'इस तैयार शिकायत को कॉपी करें और नेशनल साइबर क्राइम पोर्टल पर दर्ज करें या परिवार को व्हाट्सएप पर भेजें।',
    dateLabel: 'दिनांक और समय (Date & Time)',
    scamTypeLabel: 'धोखाधड़ी का प्रकार (Scam Type)',
    whatHappenedLabel: 'क्या हुआ — संक्षिप्त विवरण (What Happened)',
    identifiersLabel: 'ठग के फोन नंबर / यूपीआई आईडी / लिंक (Scammer Identifiers)',
    phonesLabel: 'फोन नंबर (Phones)',
    upiLabel: 'यूपीआई आईडी (UPI IDs)',
    urlsLabel: 'संदिग्ध लिंक (Links)',
    noneFound: 'कोई जानकारी नहीं मिली (None detected)',
    redFlagsLabel: 'पहचाने गए खतरे के संकेत (Red Flags)',
    paymentStatusLabel: 'ओटीपी और भुगतान की स्थिति (Payment Status)',
    noLossLine: 'मैंने कोई ओटीपी साझा नहीं किया और न ही कोई भुगतान किया (I did not share any OTP or make any payment)',
    lostMoneyPrefix: 'मेरा पैसे का नुकसान हुआ है: रु',
    checkboxLabel: '"I lost money: Rs ____" (पैसे का नुकसान हुआ है) में बदलें',
    amountPlaceholder: 'राशि दर्ज करें (जैसे 5000)',
    complaintPreviewLabel: 'पूरी शिकायत (कॉपी करने के लिए तैयार)',
    inputTypeMap: {
      call: 'संदिग्ध फोन कॉल (Phone Call)',
      image: 'स्क्रीनशॉट / संदेश (Screenshot)',
      text: 'एसएमएस / व्हाट्सएप संदेश (Message)'
    },
    whatsappHeader: '🚨 ScamShield परिवार सुरक्षा चेतावनी!'
  },
  kn: {
    panelTitle: 'ಸಿದ್ಧಪಡಿಸಿದ ಸೈಬರ್ ಅಪರಾಧ ದೂರು (1930 / cybercrime.gov.in)',
    panelSubtitle: 'ಈ ದೂರನ್ನು ಕಾಪಿ ಮಾಡಿ ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಕ್ರೈಮ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸಲ್ಲಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ.',
    dateLabel: 'ದಿನಾಂಕ ಮತ್ತು ಸಮಯ (Date & Time)',
    scamTypeLabel: 'ವಂಚನೆಯ ಪ್ರಕಾರ (Scam Type)',
    whatHappenedLabel: 'ಏನಾಯಿತು — ಸಂಕ್ಷಿಪ್ತ ವಿವರ (What Happened)',
    identifiersLabel: 'ವಂಚಕರ ಫೋನ್ ಸಂಖ್ಯೆ / ಯುಪಿಐ / ಲಿಂಕ್‌ಗಳು (Scammer Identifiers)',
    phonesLabel: 'ಫೋನ್ ಸಂಖ್ಯೆಗಳು (Phones)',
    upiLabel: 'ಯುಪಿಐ ಐಡಿ (UPI IDs)',
    urlsLabel: 'ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್‌ಗಳು (Links)',
    noneFound: 'ಪತ್ತೆಯಾಗಿಲ್ಲ (None detected)',
    redFlagsLabel: 'ಪತ್ತೆಯಾದ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು (Red Flags)',
    paymentStatusLabel: 'OTP ಮತ್ತು ಪಾವತಿ ಸ್ಥಿತಿ (Payment Status)',
    noLossLine: 'ನಾನು ಯಾವುದೇ OTP ಹಂಚಿಕೊಂಡಿಲ್ಲ ಅಥವಾ ಯಾವುದೇ ಪಾವತಿ ಮಾಡಿಲ್ಲ (I did not share any OTP or make any payment)',
    lostMoneyPrefix: 'ನಾನು ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದೇನೆ: ರೂ',
    checkboxLabel: '"I lost money: Rs ____" (ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದೇನೆ) ಎಂದು ಬದಲಾಯಿಸಿ',
    amountPlaceholder: 'ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ (ಉದಾ: 5000)',
    complaintPreviewLabel: 'ಸಂಪೂರ್ಣ ದೂರು (ಕಾಪಿ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ)',
    inputTypeMap: {
      call: 'ಅನುಮಾನಾಸ್ಪದ ಫೋನ್ ಕರೆ (Phone Call)',
      image: 'ಸ್ಕ್ರೀನ್‌ಶಾಟ್ / ಸಂದೇಶ (Screenshot)',
      text: 'ಎಸ್‌ಎಂಎಸ್ / ವಾಟ್ಸಾಪ್ ಸಂದೇಶ (Message)'
    },
    whatsappHeader: '🚨 ScamShield ಕುಟುಂಬ ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ!'
  }
};

export function formatScanDateTime(createdAt, lang = 'en') {
  const dateObj = createdAt ? new Date(createdAt) : new Date();
  if (Number.isNaN(dateObj.getTime())) {
    return String(createdAt || '');
  }
  const locale = lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN';
  return dateObj.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function buildWhatHappenedLines(scan, lang = 'en') {
  const t = COMPLAINT_UI_TEXT[lang] || COMPLAINT_UI_TEXT.en;
  const scamLabel = getScamTypeLabel(scan?.scam_type, lang);
  const inputLabel = t.inputTypeMap[scan?.input_type] || t.inputTypeMap.text;

  let line1 = '';
  if (lang === 'hi') {
    line1 = `मुझे एक ${inputLabel} प्राप्त हुआ जिसे "${scamLabel}" (जोखिम स्कोर: ${scan?.risk_score ?? 0}/100) के रूप में पहचाना गया है।`;
  } else if (lang === 'kn') {
    line1 = `ನನಗೆ ಒಂದು ${inputLabel} ಬಂದಿದ್ದು, ಅದನ್ನು "${scamLabel}" (ಅಪಾಯದ ಅಂಕ: ${scan?.risk_score ?? 0}/100) ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.`;
  } else {
    line1 = `I received a suspicious ${inputLabel} identified as "${scamLabel}" (Risk Score: ${scan?.risk_score ?? 0}/100).`;
  }

  const line2 = scan?.summary || '';
  const line3 = scan?.explanation || '';

  return [line1, line2, line3].filter(Boolean);
}

export function buildPaymentStatusLine({ lostMoney = false, lostAmount = '', lang = 'en' }) {
  const cleanAmount = String(lostAmount || '').trim() || '____';

  if (!lostMoney) {
    if (lang === 'hi') {
      return 'मैंने कोई ओटीपी साझा नहीं किया और न ही कोई भुगतान किया (I did not share any OTP or make any payment)';
    }
    if (lang === 'kn') {
      return 'ನಾನು ಯಾವುದೇ OTP ಹಂಚಿಕೊಂಡಿಲ್ಲ ಅಥವಾ ಯಾವುದೇ ಪಾವತಿ ಮಾಡಿಲ್ಲ (I did not share any OTP or make any payment)';
    }
    return 'I did not share any OTP or make any payment';
  }

  if (lang === 'hi') {
    return `मेरा पैसे का नुकसान हुआ है: रु ${cleanAmount} (I lost money: Rs ${cleanAmount})`;
  }
  if (lang === 'kn') {
    return `ನಾನು ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದೇನೆ: ರೂ ${cleanAmount} (I lost money: Rs ${cleanAmount})`;
  }
  return `I lost money: Rs ${cleanAmount}`;
}

export function buildCybercrimeComplaint({ scan, language = 'en', lostMoney = false, lostAmount = '' }) {
  if (!scan) return '';

  const lang = COMPLAINT_UI_TEXT[language] ? language : 'en';
  const t = COMPLAINT_UI_TEXT[lang];
  const dateTimeStr = formatScanDateTime(scan.created_at, lang);
  const scamTypeLabel = getScamTypeLabel(scan.scam_type, lang);
  const summaryLines = buildWhatHappenedLines(scan, lang);

  const phones = scan.identifiers?.phones?.length ? scan.identifiers.phones.join(', ') : t.noneFound;
  const upis = scan.identifiers?.upi_ids?.length ? scan.identifiers.upi_ids.join(', ') : t.noneFound;
  const urls = scan.identifiers?.urls?.length ? scan.identifiers.urls.join(', ') : t.noneFound;

  const redFlagsList = (scan.red_flags || []).map((rf, idx) => {
    const evidencePart = rf.evidence ? ` ("${rf.evidence}")` : '';
    const explanationPart = rf.explanation ? ` — ${rf.explanation}` : '';
    return `${idx + 1}. ${rf.flag}${evidencePart}${explanationPart}`;
  });

  const paymentLine = buildPaymentStatusLine({ lostMoney, lostAmount, lang });

  const lines = [
    t.panelTitle,
    '====================================================',
    `${t.dateLabel}: ${dateTimeStr}`,
    `${t.scamTypeLabel}: ${scamTypeLabel} (${String(scan.risk_level || '').toUpperCase()} - ${scan.risk_score ?? 0}/100)`,
    '',
    `${t.whatHappenedLabel}:`,
    ...summaryLines,
    '',
    `${t.identifiersLabel}:`,
    `- ${t.phonesLabel}: ${phones}`,
    `- ${t.upiLabel}: ${upis}`,
    `- ${t.urlsLabel}: ${urls}`,
    '',
    `${t.redFlagsLabel}:`,
    ...(redFlagsList.length > 0 ? redFlagsList : [`- ${t.noneFound}`]),
    '',
    `${t.paymentStatusLabel}:`,
    paymentLine
  ];

  return lines.join('\n');
}

export function buildFamilyWhatsAppWarning({ scan, language = 'en' }) {
  if (!scan) return 'https://wa.me/';
  const lang = COMPLAINT_UI_TEXT[language] ? language : 'en';
  const t = COMPLAINT_UI_TEXT[lang];
  const scamTypeLabel = getScamTypeLabel(scan.scam_type, lang);

  const allIdentifiers = [
    ...(scan.identifiers?.phones || []),
    ...(scan.identifiers?.upi_ids || []),
    ...(scan.identifiers?.urls || [])
  ];
  const idText = allIdentifiers.length > 0 ? allIdentifiers.join(', ') : '';

  let message = '';
  if (lang === 'hi') {
    message =
      `${t.whatsappHeader}\n` +
      `सावधान रहें! यह "${scamTypeLabel}" का धोखा है (${scan.risk_score}/100 जोखिम)।\n` +
      `${scan.summary}\n` +
      (idText ? `ठग की पहचान: ${idText}\n` : '') +
      `किसी भी अनजान लिंक पर क्लिक न करें और न ही OTP साझा करें। साइबर हेल्पलाइन: 1930`;
  } else if (lang === 'kn') {
    message =
      `${t.whatsappHeader}\n` +
      `ಎಚ್ಚರಿಕೆ! ಇದು "${scamTypeLabel}" ವಂಚನೆಯಾಗಿದೆ (${scan.risk_score}/100 ಅಪಾಯ).\n` +
      `${scan.summary}\n` +
      (idText ? `ವಂಚಕರ ವಿವರ: ${idText}\n` : '') +
      `ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ ಅಥವಾ OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ. ಸಹಾಯವಾಣಿ: 1930`;
  } else {
    message =
      `${t.whatsappHeader}\n` +
      `Be careful! We detected a "${scamTypeLabel}" (${scan.risk_score}/100 risk).\n` +
      `${scan.summary}\n` +
      (idText ? `Scammer details: ${idText}\n` : '') +
      `Never click unknown links or share OTPs. Cybercrime Helpline: 1930`;
  }

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
