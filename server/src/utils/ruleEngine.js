// Rule-based scam check used when every AI model is unavailable, so users
// always get a result. Keyword and pattern rules in English, Hindi and Kannada
// (including common romanised Hindi). Output matches the AI result shape, plus
// source: "rules".

import { RISK_BANDS } from '../config/constants.js';
import { localized } from './localizedText.js';

const BASE_SCORE = 8;
const MAX_SCORE = 97;
const MAX_EVIDENCE = 160;

// Words that turn "share your OTP" into the genuine warning "do not share your OTP".
// Hindi/Kannada negations must be whole words ("ना" inside "अपना" is not one).
const NEGATION_BEFORE = /(\b(do\s*not|don'?t|never|mat)|(^|\s)(मत|न\s*करें|कभी\s*न))\s*\S*\s*$/iu;
const NEGATION_AFTER = /^\S*\s*\S*\s*((मत|न)(\s|$|।)|न\s*करें|नहीं|ಬೇಡ|ಮಾಡಬೇಡಿ|ಹಂಚಿಕೊಳ್ಳಬೇಡಿ)/u;

// Genuine bank warnings ("never tell anyone your OTP") use secrecy words too.
const NEAR_CREDENTIALS = /otp|pin\b|cvv|password|ओटीपी|पिन|पासवर्ड|ಒಟಿಪಿ|ಪಿನ್|ಪಾಸ್‌?ವರ್ಡ್/iu;

/**
 * Each rule: scam type it points to, weight added to the risk score (counted
 * once per rule), patterns, and the localized red flag text.
 */
const RULES = [
  {
    id: 'digital_arrest',
    scamType: 'digital_arrest',
    weight: 45,
    patterns: [
      /digital\s*arrest/i,
      /arrest\s*warrant/i,
      /money[\s-]*laundering/i,
      /narcotics|mdma|drugs?\s*(parcel|found|seized)/i,
      /(rbi|safe|secret)\s*(custody|verification|escrow)\s*account|verification\s*account/i,
      /डिजिटल\s*(अरेस्ट|गिरफ्तारी|गिरफ़्तारी)/u,
      /(गिरफ्तारी|गिरफ़्तारी)\s*वारंट|मनी\s*लॉन्ड्रिंग|ड्रग्स/u,
      /ಡಿಜಿಟಲ್\s*ಅರೆಸ್ಟ್|ಬಂಧನ\s*ವಾರಂಟ್|ಮನಿ\s*ಲಾಂಡರಿಂಗ್|ಡ್ರಗ್ಸ್|ಮಾದಕ\s*ವಸ್ತು/u,
    ],
    text: {
      en: ['Fake arrest threat', 'Police, CBI or customs never arrest anyone over a call or ask for money to clear a case. "Digital arrest" does not exist.'],
      hi: ['नकली गिरफ्तारी की धमकी', 'पुलिस, CBI या कस्टम्स कभी फोन पर गिरफ्तारी नहीं करते और केस खत्म करने के लिए पैसे नहीं माँगते। "डिजिटल अरेस्ट" जैसी कोई चीज़ नहीं होती।'],
      kn: ['ನಕಲಿ ಬಂಧನದ ಬೆದರಿಕೆ', 'ಪೊಲೀಸ್, CBI ಅಥವಾ ಕಸ್ಟಮ್ಸ್ ಯಾರನ್ನೂ ಕರೆಯಲ್ಲಿ ಬಂಧಿಸುವುದಿಲ್ಲ ಮತ್ತು ಪ್ರಕರಣ ಮುಗಿಸಲು ಹಣ ಕೇಳುವುದಿಲ್ಲ. "ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್" ಎಂಬುದೇ ಇಲ್ಲ.'],
    },
  },
  {
    id: 'authority',
    scamType: 'impersonation',
    weight: 20,
    patterns: [
      /\b(cbi|ncb|trai|enforcement\s*directorate|customs\s*officer|crime\s*branch|cyber\s*(crime|cell)|police\s*(officer|inspector|station)|inspector)\b/i,
      /सीबीआई|पुलिस|कस्टम्स|क्राइम\s*ब्रांच|साइबर\s*सेल/u,
      /ಸಿಬಿಐ|ಪೊಲೀಸ್|ಕಸ್ಟಮ್ಸ್|ಸೈಬರ್\s*ಕ್ರೈಮ್/u,
    ],
    text: {
      en: ['Claims to be an official', 'Scammers pretend to be police, CBI, bank or government staff so you trust them and feel scared.'],
      hi: ['खुद को अधिकारी बताना', 'ठग पुलिस, CBI, बैंक या सरकारी कर्मचारी बनकर डराते हैं ताकि आप उन पर भरोसा कर लें।'],
      kn: ['ಅಧಿಕಾರಿ ಎಂದು ಹೇಳಿಕೊಳ್ಳುವುದು', 'ವಂಚಕರು ಪೊಲೀಸ್, CBI, ಬ್ಯಾಂಕ್ ಅಥವಾ ಸರ್ಕಾರಿ ಸಿಬ್ಬಂದಿ ಎಂದು ನಟಿಸಿ ನಿಮ್ಮನ್ನು ಹೆದರಿಸುತ್ತಾರೆ.'],
    },
  },
  {
    id: 'kyc',
    scamType: 'kyc_bank',
    weight: 35,
    patterns: [
      /\bkyc\b/i,
      /pan\s*(card)?\s*(update|link|verify|verification)/i,
      /account\s*(will\s*be\s*|has\s*been\s*|is\s*)?(blocked|suspended|deactivated|closed|frozen)/i,
      /केवाईसी|खाता\s*(बंद|ब्लॉक|निलंबित)/u,
      /ಕೆವೈಸಿ|ಖಾತೆ\s*(ಬ್ಲಾಕ್|ಸ್ಥಗಿತ|ಬಂದ್)/u,
    ],
    text: {
      en: ['Fake KYC / account block', 'Banks never block your account or ask for KYC updates through SMS, WhatsApp or calls.'],
      hi: ['नकली KYC / खाता बंद', 'बैंक कभी SMS, WhatsApp या कॉल से खाता बंद करने या KYC अपडेट की बात नहीं करते।'],
      kn: ['ನಕಲಿ KYC / ಖಾತೆ ಬ್ಲಾಕ್', 'ಬ್ಯಾಂಕ್‌ಗಳು SMS, WhatsApp ಅಥವಾ ಕರೆಯ ಮೂಲಕ ಖಾತೆ ಬ್ಲಾಕ್ ಅಥವಾ KYC ಅಪ್‌ಡೇಟ್ ಕೇಳುವುದಿಲ್ಲ.'],
    },
  },
  {
    id: 'otp',
    scamType: 'kyc_bank',
    weight: 35,
    negatable: true,
    patterns: [
      /(share|send|tell|give|read|forward|enter)\s*(me\s*|us\s*)?(the\s*|your\s*)?(otp|pin|cvv|password|one[\s-]*time\s*password)/i,
      /(otp|ओटीपी)\s*(batao|bataiye|bhejo|बताओ|बताइए|बताएं|बताइये|भेजो|भेजें)/iu,
      /(ಒಟಿಪಿ|otp)\s*(ಹೇಳಿ|ಕಳುಹಿಸಿ|ತಿಳಿಸಿ)/iu,
      /anydesk|teamviewer|quick\s*support|rustdesk|screen\s*shar(e|ing)/i,
    ],
    text: {
      en: ['Asks for OTP / PIN / remote access', 'No real bank or company ever asks for your OTP, PIN or CVV, or asks you to install a screen-sharing app.'],
      hi: ['OTP / PIN / रिमोट ऐप माँगना', 'कोई असली बैंक या कंपनी कभी OTP, PIN या CVV नहीं माँगती, न ही स्क्रीन-शेयरिंग ऐप डलवाती है।'],
      kn: ['OTP / PIN / ರಿಮೋಟ್ ಆ್ಯಪ್ ಕೇಳುವುದು', 'ಯಾವುದೇ ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಅಥವಾ ಕಂಪನಿ OTP, PIN ಅಥವಾ CVV ಕೇಳುವುದಿಲ್ಲ, ಸ್ಕ್ರೀನ್-ಶೇರಿಂಗ್ ಆ್ಯಪ್ ಹಾಕಿಸುವುದಿಲ್ಲ.'],
    },
  },
  {
    id: 'upi_collect',
    scamType: 'upi_payment_request',
    weight: 35,
    patterns: [
      /collect\s*request/i,
      /(enter|type)\s*(your\s*)?(upi\s*)?pin\s*(to\s*)?(receive|get|claim|accept)/i,
      /scan\s*(the\s*|this\s*)?qr.{0,30}(receive|get|claim)/i,
      /कलेक्ट\s*रिक्वेस्ट|(पैसे|रकम|कैशबैक).{0,20}(पाने|प्राप्त).{0,20}(पिन|PIN)/u,
      /(ಹಣ|ಕ್ಯಾಶ್\S*ಬ್ಯಾಕ್).{0,20}ಪಡೆಯಲು.{0,20}(ಪಿನ್|PIN)/u,
    ],
    text: {
      en: ['UPI PIN to "receive" money', 'You never need to enter your UPI PIN to receive money. Entering it sends money out of your account.'],
      hi: ['पैसे "पाने" के लिए UPI PIN', 'पैसे पाने के लिए कभी UPI PIN नहीं डालना पड़ता। PIN डालने से पैसे आपके खाते से चले जाते हैं।'],
      kn: ['ಹಣ "ಪಡೆಯಲು" UPI PIN', 'ಹಣ ಪಡೆಯಲು UPI PIN ಎಂದಿಗೂ ಬೇಕಾಗುವುದಿಲ್ಲ. PIN ಹಾಕಿದರೆ ಹಣ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹೋಗುತ್ತದೆ.'],
    },
  },
  {
    id: 'lottery',
    scamType: 'lottery_prize',
    weight: 30,
    patterns: [
      /lottery|lucky\s*draw|jackpot|\bkbc\b|you\s*(have\s*)?won|won\s*(a\s*)?(prize|cash|reward|car|iphone)|claim\s*(your\s*)?(prize|reward)/i,
      /लॉटरी|लकी\s*ड्रॉ|इनाम\s*जीत|आपने.{0,20}जीत/u,
      /ಲಾಟರಿ|ಲಕ್ಕಿ\s*ಡ್ರಾ|ಬಹುಮಾನ\s*ಗೆದ್ದ/u,
    ],
    text: {
      en: ['Prize or lottery you never entered', 'Real prizes never ask you to pay a fee or tax first. This is a common trick to take your money.'],
      hi: ['बिना भाग लिए इनाम या लॉटरी', 'असली इनाम के लिए कभी पहले शुल्क या टैक्स नहीं देना पड़ता। यह पैसे ठगने की आम चाल है।'],
      kn: ['ಭಾಗವಹಿಸದೆ ಬಹುಮಾನ ಅಥವಾ ಲಾಟರಿ', 'ನಿಜವಾದ ಬಹುಮಾನಕ್ಕೆ ಮೊದಲು ಶುಲ್ಕ ಅಥವಾ ತೆರಿಗೆ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ. ಇದು ಹಣ ವಂಚಿಸುವ ಸಾಮಾನ್ಯ ತಂತ್ರ.'],
    },
  },
  {
    id: 'job_task',
    scamType: 'job_task',
    weight: 30,
    patterns: [
      /part[\s-]*time\s*(job|work|income)/i,
      /work\s*from\s*home/i,
      /(like|rate|review)\s*(youtube\s*)?(videos?|hotels?|products?).{0,40}(earn|rs\.?|₹|paid)/i,
      /(earn|income)\s*(rs\.?|₹)?\s*\d[\d,]*\s*(daily|per\s*day|a\s*day)/i,
      /(prepaid|vip|merchant)\s*task/i,
      /पार्ट\s*टाइम|घर\s*बैठे.{0,20}कमा|रोज़?\s*₹?\s*\d+.{0,10}कमा/u,
      /ಪಾರ್ಟ್\s*ಟೈಮ್|ಮನೆಯಿಂದಲೇ\s*(ಕೆಲಸ|ಗಳಿಸಿ)/u,
    ],
    text: {
      en: ['Easy-money task job', 'Jobs that pay for liking videos or simple tasks, then ask for a deposit, are scams.'],
      hi: ['आसान कमाई वाला टास्क जॉब', 'वीडियो लाइक करने या आसान टास्क के पैसे देकर फिर जमा राशि माँगने वाली नौकरियाँ धोखा होती हैं।'],
      kn: ['ಸುಲಭ ಹಣದ ಟಾಸ್ಕ್ ಕೆಲಸ', 'ವಿಡಿಯೋ ಲೈಕ್ ಅಥವಾ ಸರಳ ಕೆಲಸಕ್ಕೆ ಹಣ ಕೊಟ್ಟು ನಂತರ ಠೇವಣಿ ಕೇಳುವ ಕೆಲಸಗಳು ವಂಚನೆ.'],
    },
  },
  {
    id: 'courier',
    scamType: 'delivery_courier',
    weight: 25,
    patterns: [
      /(fedex|dhl|blue\s*dart|india\s*post|courier|parcel|package|shipment).{0,60}(held|seized|stuck|customs|on\s*hold|undelivered|address|re-?delivery|fee)/i,
      /customs\s*(duty|fee|clearance|charges)/i,
      /(कूरियर|पार्सल).{0,40}(रोका|जब्त|कस्टम|शुल्क|पता)/u,
      /(ಕೊರಿಯರ್|ಪಾರ್ಸೆಲ್).{0,40}(ತಡೆ|ವಶ|ಕಸ್ಟಮ್ಸ್|ಶುಲ್ಕ|ವಿಳಾಸ)/u,
    ],
    text: {
      en: ['Parcel / customs trouble', 'Fake courier messages claim a parcel is held to make you pay a fee or panic.'],
      hi: ['पार्सल / कस्टम्स की समस्या', 'नकली कूरियर संदेश पार्सल रुकने की बात कहकर शुल्क भरवाते हैं या डराते हैं।'],
      kn: ['ಪಾರ್ಸೆಲ್ / ಕಸ್ಟಮ್ಸ್ ತೊಂದರೆ', 'ನಕಲಿ ಕೊರಿಯರ್ ಸಂದೇಶಗಳು ಪಾರ್ಸೆಲ್ ತಡೆಹಿಡಿಯಲಾಗಿದೆ ಎಂದು ಹೇಳಿ ಶುಲ್ಕ ಕಟ್ಟಿಸುತ್ತವೆ.'],
    },
  },
  {
    id: 'electricity',
    scamType: 'electricity_bill',
    weight: 30,
    patterns: [
      /electricity.{0,50}(disconnect|cut|suspend)/i,
      /power\s*(supply\s*)?(will\s*be\s*)?(cut|disconnected)/i,
      /बिजली.{0,40}(कट|काट|बंद)/u,
      /ವಿದ್ಯುತ್.{0,40}(ಕಡಿತ|ಸ್ಥಗಿತ|ಕಟ್)/u,
    ],
    text: {
      en: ['Power cut threat', 'Electricity boards do not threaten to cut power tonight through SMS or WhatsApp.'],
      hi: ['बिजली काटने की धमकी', 'बिजली विभाग SMS या WhatsApp से आज रात बिजली काटने की धमकी नहीं देता।'],
      kn: ['ವಿದ್ಯುತ್ ಕಡಿತದ ಬೆದರಿಕೆ', 'ವಿದ್ಯುತ್ ಮಂಡಳಿ SMS ಅಥವಾ WhatsApp ಮೂಲಕ ಇಂದು ರಾತ್ರಿ ವಿದ್ಯುತ್ ಕಡಿತದ ಬೆದರಿಕೆ ಹಾಕುವುದಿಲ್ಲ.'],
    },
  },
  {
    id: 'loan',
    scamType: 'loan_app',
    weight: 25,
    patterns: [
      /instant\s*loan|loan\s*(is\s*)?(approved|sanctioned)|pre[\s-]*approved\s*loan|loan.{0,20}without\s*(any\s*)?documents?/i,
      /लोन\s*(मंजूर|अप्रूव)|तुरंत\s*लोन/u,
      /ತ್ವರಿತ\s*ಸಾಲ|ಸಾಲ\s*ಮಂಜೂರು/u,
    ],
    text: {
      en: ['Instant loan offer', 'Instant-loan apps often steal your contacts and photos and then harass you for money.'],
      hi: ['तुरंत लोन का ऑफ़र', 'तुरंत लोन वाले ऐप अक्सर आपके कॉन्टैक्ट और फोटो चुराकर पैसे के लिए परेशान करते हैं।'],
      kn: ['ತ್ವರಿತ ಸಾಲದ ಆಫರ್', 'ತ್ವರಿತ ಸಾಲದ ಆ್ಯಪ್‌ಗಳು ನಿಮ್ಮ ಸಂಪರ್ಕ ಮತ್ತು ಫೋಟೋ ಕದ್ದು ಹಣಕ್ಕಾಗಿ ಕಿರುಕುಳ ನೀಡುತ್ತವೆ.'],
    },
  },
  {
    id: 'investment',
    scamType: 'investment_trading',
    weight: 25,
    patterns: [
      /guaranteed\s*(returns?|profits?)|double\s*your\s*(money|investment)|\d+\s*%\s*(daily|weekly|monthly)?\s*(returns?|profits?)|stock\s*(market\s*)?tips|trading\s*(app|group|platform)|ipo\s*allot/i,
      /पैसा\s*दोगुना|गारंटीड?\s*(रिटर्न|मुनाफा)/u,
      /ಹಣ\s*ದ್ವಿಗುಣ|ಖಚಿತ\s*ಲಾಭ/u,
    ],
    text: {
      en: ['Guaranteed profit promise', 'No real investment guarantees high returns. These groups and apps take your money and disappear.'],
      hi: ['पक्का मुनाफा का वादा', 'कोई असली निवेश ऊँचे मुनाफे की गारंटी नहीं देता। ऐसे ग्रुप और ऐप पैसे लेकर गायब हो जाते हैं।'],
      kn: ['ಖಚಿತ ಲಾಭದ ಭರವಸೆ', 'ಯಾವ ನಿಜವಾದ ಹೂಡಿಕೆಯೂ ಹೆಚ್ಚಿನ ಲಾಭದ ಖಚಿತತೆ ನೀಡುವುದಿಲ್ಲ. ಇಂತಹ ಗುಂಪುಗಳು ಹಣ ತೆಗೆದುಕೊಂಡು ಮಾಯವಾಗುತ್ತವೆ.'],
    },
  },
  {
    id: 'sextortion',
    scamType: 'sextortion',
    weight: 40,
    patterns: [
      /nude|naked|intimate\s*(video|photo)|private\s*(video|photos?)|(leak|viral).{0,30}(video|photos?)/i,
      /अश्लील|न्यूड|वीडियो\s*वायरल/u,
      /ಖಾಸಗಿ\s*(ವಿಡಿಯೋ|ಫೋಟೋ)|ನಗ್ನ/u,
    ],
    text: {
      en: ['Blackmail with private videos', 'Do not pay. Paying never stops blackmail. Report it at cybercrime.gov.in or call 1930.'],
      hi: ['निजी वीडियो से ब्लैकमेल', 'पैसे न दें, इससे ब्लैकमेल नहीं रुकता। cybercrime.gov.in पर शिकायत करें या 1930 पर कॉल करें।'],
      kn: ['ಖಾಸಗಿ ವಿಡಿಯೋ ಮೂಲಕ ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್', 'ಹಣ ಕೊಡಬೇಡಿ, ಅದರಿಂದ ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್ ನಿಲ್ಲುವುದಿಲ್ಲ. cybercrime.gov.in ನಲ್ಲಿ ದೂರು ನೀಡಿ ಅಥವಾ 1930 ಗೆ ಕರೆ ಮಾಡಿ.'],
    },
  },
  {
    id: 'secrecy',
    scamType: 'other',
    weight: 20,
    skipNearCredentials: true,
    patterns: [
      /(don'?t|do\s*not)\s*(tell|inform)\s*(anyone|anybody|your\s*(family|son|daughter|husband|wife))/i,
      /keep\s*(it|this)\s*(a\s*)?secret|do\s*not\s*disconnect|don'?t\s*(cut|disconnect)\s*(the\s*)?call/i,
      /किसी\s*को\s*(मत|न)\s*बता|कॉल\s*मत\s*काट/u,
      /ಯಾರಿಗೂ\s*(ಹೇಳಬೇಡಿ|ತಿಳಿಸಬೇಡಿ)|ಕರೆ\s*ಕಟ್\s*ಮಾಡಬೇಡಿ/u,
    ],
    text: {
      en: ['Asks you to keep it secret', 'Scammers keep you alone and on the line so family cannot warn you. Talk to someone you trust.'],
      hi: ['बात छिपाने को कहना', 'ठग आपको अकेला रखते हैं ताकि परिवार आपको सावधान न कर सके। किसी भरोसेमंद व्यक्ति से बात करें।'],
      kn: ['ರಹಸ್ಯವಾಗಿಡಲು ಹೇಳುವುದು', 'ಕುಟುಂಬದವರು ಎಚ್ಚರಿಸದಂತೆ ವಂಚಕರು ನಿಮ್ಮನ್ನು ಒಂಟಿಯಾಗಿರಿಸುತ್ತಾರೆ. ನಂಬಿಕಸ್ಥರೊಂದಿಗೆ ಮಾತನಾಡಿ.'],
    },
  },
  {
    id: 'money',
    scamType: 'other',
    weight: 20,
    patterns: [
      /transfer\s*(the\s*|your\s*|all\s*)?(money|amount|funds|savings)/i,
      /(pay|deposit|send)\s*(rs\.?|₹|inr)\s*\d[\d,]*/i,
      /fee\s*(of\s*)?(rs\.?|₹|inr)\s*\d[\d,]*/i,
      /(processing|registration|verification|security|clearance)\s*(fee|charge|deposit)/i,
      /पैसे\s*(भेज|ट्रांसफर|जमा)|शुल्क\s*(भर|जमा)/u,
      /ಹಣ\s*(ಕಳುಹಿಸಿ|ವರ್ಗಾಯಿಸಿ|ಜಮಾ)|ಶುಲ್ಕ\s*(ಪಾವತಿಸಿ|ಕಟ್ಟಿ)/u,
    ],
    text: {
      en: ['Asks you to pay or transfer money', 'Be very careful when a message asks for a fee, deposit or transfer. Verify through the official source first.'],
      hi: ['पैसे भेजने या शुल्क भरने को कहना', 'जब कोई संदेश शुल्क, जमा राशि या ट्रांसफर माँगे तो बहुत सावधान रहें। पहले आधिकारिक स्रोत से जाँचें।'],
      kn: ['ಹಣ ಕಳುಹಿಸಲು ಅಥವಾ ಶುಲ್ಕ ಕಟ್ಟಲು ಕೇಳುವುದು', 'ಸಂದೇಶ ಶುಲ್ಕ, ಠೇವಣಿ ಅಥವಾ ವರ್ಗಾವಣೆ ಕೇಳಿದರೆ ಬಹಳ ಎಚ್ಚರ ವಹಿಸಿ. ಮೊದಲು ಅಧಿಕೃತ ಮೂಲದಿಂದ ಪರಿಶೀಲಿಸಿ.'],
    },
  },
  {
    id: 'suspicious_link',
    scamType: 'phishing_link',
    weight: 25,
    patterns: [
      /(bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|is\.gd|t\.me|wa\.me)\/\S+/i,
      /https?:\/\/\S*(kyc|verify|update|login|secure|account|bank|sbi|hdfc|icici|paytm|reward|refund)\S*/i,
      /\b[\w-]+\.(xyz|top|online|site|club|icu|buzz|vip|tk|ml|ga|cf|gq|shop|live)\b(\/\S*)?/i,
      /\S+\.apk\b/i,
    ],
    text: {
      en: ['Suspicious link', 'This link uses a short-link, an unusual domain or bank-related words to look official. Do not open it.'],
      hi: ['संदिग्ध लिंक', 'यह लिंक छोटा लिंक, अजीब डोमेन या बैंक जैसे शब्द इस्तेमाल करता है ताकि असली लगे। इसे न खोलें।'],
      kn: ['ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್', 'ಈ ಲಿಂಕ್ ಚಿಕ್ಕ ಲಿಂಕ್, ವಿಚಿತ್ರ ಡೊಮೇನ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ಪದಗಳನ್ನು ಬಳಸಿ ನಿಜವೆಂಬಂತೆ ತೋರಿಸುತ್ತದೆ. ತೆರೆಯಬೇಡಿ.'],
    },
  },
  {
    id: 'link',
    scamType: 'phishing_link',
    weight: 10,
    patterns: [/https?:\/\/\S+|\bwww\.\S+/i],
    text: {
      en: ['Contains a link', 'Open links only if you are sure who sent them. Type the official website address yourself instead.'],
      hi: ['लिंक मौजूद है', 'लिंक तभी खोलें जब भेजने वाले पर पूरा भरोसा हो। आधिकारिक वेबसाइट का पता खुद टाइप करें।'],
      kn: ['ಲಿಂಕ್ ಇದೆ', 'ಕಳುಹಿಸಿದವರ ಬಗ್ಗೆ ಖಚಿತವಿದ್ದಾಗ ಮಾತ್ರ ಲಿಂಕ್ ತೆರೆಯಿರಿ. ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ವಿಳಾಸವನ್ನು ನೀವೇ ಟೈಪ್ ಮಾಡಿ.'],
    },
  },
  {
    id: 'urgency',
    scamType: 'other',
    weight: 12,
    patterns: [
      /\b(urgent(ly)?|immediately|right\s*now|act\s*now|tonight|last\s*(chance|warning|reminder)|final\s*notice|today\s*itself|within\s*\d+\s*(hours?|hrs?|minutes?|mins?))\b/i,
      /तुरंत|फौरन|आज\s*ही|आज\s*रात|अंतिम\s*चेतावनी/u,
      /ತಕ್ಷಣ|ಕೂಡಲೇ|ಇಂದೇ|ಇಂದು\s*ರಾತ್ರಿ|ಕೊನೆಯ\s*ಎಚ್ಚರಿಕೆ/u,
    ],
    text: {
      en: ['Pressure to act fast', 'Scammers rush you so you do not stop to check. A real organisation gives you time.'],
      hi: ['जल्दी करने का दबाव', 'ठग जल्दबाज़ी करवाते हैं ताकि आप जाँच न कर सकें। असली संस्था आपको समय देती है।'],
      kn: ['ತ್ವರೆ ಮಾಡುವ ಒತ್ತಡ', 'ನೀವು ಪರಿಶೀಲಿಸದಂತೆ ವಂಚಕರು ತ್ವರೆ ಮಾಡಿಸುತ್ತಾರೆ. ನಿಜವಾದ ಸಂಸ್ಥೆ ನಿಮಗೆ ಸಮಯ ನೀಡುತ್ತದೆ.'],
    },
  },
];

const TEXT = {
  en: {
    scamSummary: (flags) => `Quick check: strong scam warning signs found (${flags}).`,
    suspiciousSummary: (flags) => `Quick check: some warning signs found (${flags}). Be careful.`,
    safeSummary: 'Quick check found no common scam signs. Still verify on the official app or website before acting.',
    explanation:
      'Our AI check is busy right now, so this result comes from a quick keyword check. It looks for common scam signs such as threats, OTP requests, payment demands and suspicious links. Do not click links, share OTPs or send money until you have checked with the official source.',
    safeReason: 'No common scam keywords, payment requests or suspicious links were found.',
    imageSummary: 'We could not check this screenshot right now.',
    imageExplanation:
      'Our AI check is busy, and a screenshot cannot be read without it. Paste the message text to get an instant quick check, or try again in a minute. Until then, do not click links, share OTPs or send money.',
  },
  hi: {
    scamSummary: (flags) => `त्वरित जाँच: धोखाधड़ी के गंभीर संकेत मिले (${flags})।`,
    suspiciousSummary: (flags) => `त्वरित जाँच: कुछ चेतावनी संकेत मिले (${flags})। सावधान रहें।`,
    safeSummary: 'त्वरित जाँच में धोखाधड़ी के आम संकेत नहीं मिले। फिर भी कुछ करने से पहले आधिकारिक ऐप या वेबसाइट पर जाँच लें।',
    explanation:
      'हमारी AI जाँच अभी व्यस्त है, इसलिए यह नतीजा एक तेज़ कीवर्ड जाँच से आया है। यह धमकी, OTP माँगने, पैसे की माँग और संदिग्ध लिंक जैसे आम संकेत खोजती है। आधिकारिक स्रोत से पुष्टि किए बिना कोई लिंक न खोलें, OTP न बताएं और पैसे न भेजें।',
    safeReason: 'धोखाधड़ी के आम शब्द, पैसे की माँग या संदिग्ध लिंक नहीं मिले।',
    imageSummary: 'हम अभी इस स्क्रीनशॉट की जाँच नहीं कर सके।',
    imageExplanation:
      'हमारी AI जाँच अभी व्यस्त है और उसके बिना स्क्रीनशॉट पढ़ा नहीं जा सकता। तुरंत जाँच के लिए संदेश का टेक्स्ट पेस्ट करें या एक मिनट बाद फिर कोशिश करें। तब तक कोई लिंक न खोलें, OTP न बताएं और पैसे न भेजें।',
  },
  kn: {
    scamSummary: (flags) => `ತ್ವರಿತ ಪರಿಶೀಲನೆ: ವಂಚನೆಯ ಗಂಭೀರ ಸೂಚನೆಗಳು ಕಂಡುಬಂದಿವೆ (${flags}).`,
    suspiciousSummary: (flags) => `ತ್ವರಿತ ಪರಿಶೀಲನೆ: ಕೆಲವು ಎಚ್ಚರಿಕೆಯ ಸೂಚನೆಗಳು ಕಂಡುಬಂದಿವೆ (${flags}). ಜಾಗರೂಕರಾಗಿರಿ.`,
    safeSummary: 'ತ್ವರಿತ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಸಾಮಾನ್ಯ ವಂಚನೆಯ ಸೂಚನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಆದರೂ ಏನಾದರೂ ಮಾಡುವ ಮೊದಲು ಅಧಿಕೃತ ಆ್ಯಪ್ ಅಥವಾ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    explanation:
      'ನಮ್ಮ AI ಪರಿಶೀಲನೆ ಈಗ ಕಾರ್ಯನಿರತವಾಗಿದೆ, ಆದ್ದರಿಂದ ಈ ಫಲಿತಾಂಶ ತ್ವರಿತ ಪದ ಪರಿಶೀಲನೆಯಿಂದ ಬಂದಿದೆ. ಇದು ಬೆದರಿಕೆ, OTP ಕೇಳುವುದು, ಹಣದ ಬೇಡಿಕೆ ಮತ್ತು ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್‌ಗಳಂತಹ ಸಾಮಾನ್ಯ ಸೂಚನೆಗಳನ್ನು ಹುಡುಕುತ್ತದೆ. ಅಧಿಕೃತ ಮೂಲದಿಂದ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳುವವರೆಗೆ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ, OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ ಅಥವಾ ಹಣ ಕಳುಹಿಸಬೇಡಿ.',
    safeReason: 'ಸಾಮಾನ್ಯ ವಂಚನೆಯ ಪದಗಳು, ಹಣದ ಬೇಡಿಕೆ ಅಥವಾ ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
    imageSummary: 'ಈ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಅನ್ನು ಈಗ ಪರಿಶೀಲಿಸಲು ಆಗಲಿಲ್ಲ.',
    imageExplanation:
      'ನಮ್ಮ AI ಪರಿಶೀಲನೆ ಕಾರ್ಯನಿರತವಾಗಿದೆ ಮತ್ತು ಅದಿಲ್ಲದೆ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಓದಲು ಆಗುವುದಿಲ್ಲ. ತ್ವರಿತ ಪರಿಶೀಲನೆಗಾಗಿ ಸಂದೇಶದ ಪಠ್ಯವನ್ನು ಪೇಸ್ಟ್ ಮಾಡಿ ಅಥವಾ ಒಂದು ನಿಮಿಷದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. ಅಲ್ಲಿಯವರೆಗೆ ಲಿಂಕ್ ತೆರೆಯಬೇಡಿ, OTP ಹಂಚಿಕೊಳ್ಳಬೇಡಿ ಅಥವಾ ಹಣ ಕಳುಹಿಸಬೇಡಿ.',
  },
};

const t = (language) => TEXT[language] ?? TEXT.en;

function isNegated(text, index, length) {
  const before = text.slice(Math.max(0, index - 25), index);
  const after = text.slice(index + length, index + length + 30);
  return NEGATION_BEFORE.test(before) || NEGATION_AFTER.test(after.trim());
}

function firstMatch(rule, text) {
  for (const pattern of rule.patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    for (const match of text.matchAll(new RegExp(pattern.source, flags))) {
      if (rule.negatable && isNegated(text, match.index, match[0].length)) continue;
      if (rule.skipNearCredentials) {
        const around = text.slice(Math.max(0, match.index - 25), match.index + match[0].length + 25);
        if (NEAR_CREDENTIALS.test(around)) continue;
      }
      return match[0].trim().slice(0, MAX_EVIDENCE);
    }
  }
  return null;
}

function riskLevelFor(score) {
  if (score >= RISK_BANDS.scam.min) return 'scam';
  if (score >= RISK_BANDS.suspicious.min) return 'suspicious';
  return 'safe';
}

/** Runs every rule over the text. Returns matched rules (strongest first) and the score. */
export function evaluateRules(text, language = 'en') {
  const source = typeof text === 'string' ? text : '';
  const matches = [];
  for (const rule of RULES) {
    const evidence = source ? firstMatch(rule, source) : null;
    if (evidence) {
      const [flag, explanation] = rule.text[language] ?? rule.text.en;
      matches.push({ rule, evidence, flag, explanation });
    }
  }
  matches.sort((a, b) => b.rule.weight - a.rule.weight);

  const score = Math.min(MAX_SCORE, BASE_SCORE + matches.reduce((sum, m) => sum + m.rule.weight, 0));
  const riskLevel = riskLevelFor(score);
  const scamType = riskLevel === 'safe' ? 'none' : (matches.find((m) => m.rule.scamType !== 'other')?.rule.scamType ?? 'other');
  return { matches, score, riskLevel, scamType };
}

/**
 * Message/screenshot fallback with the same shape as the AI analysis.
 * With no text to check (screenshot only), returns a cautious "suspicious"
 * result asking the user to paste the text.
 */
export function analyzeWithRules(text, language = 'en') {
  const strings = t(language);
  const hasText = typeof text === 'string' && text.trim().length > 0;

  if (!hasText) {
    return {
      extracted_text: '',
      risk_level: 'suspicious',
      risk_score: 50,
      scam_type: 'other',
      red_flags: [],
      summary: strings.imageSummary,
      explanation: strings.imageExplanation,
      actions: localized(language, 'scamActions'),
      safe_reasons: [],
      source: 'rules',
    };
  }

  const { matches, score, riskLevel, scamType } = evaluateRules(text, language);
  const flagNames = matches.slice(0, 3).map((m) => m.flag).join(', ');
  const summaries = {
    scam: strings.scamSummary(flagNames),
    suspicious: strings.suspiciousSummary(flagNames),
    safe: strings.safeSummary,
  };

  return {
    extracted_text: text.trim(),
    risk_level: riskLevel,
    risk_score: score,
    scam_type: scamType,
    red_flags: matches.map(({ flag, evidence, explanation }) => ({ flag, evidence, explanation })),
    summary: summaries[riskLevel],
    explanation: strings.explanation,
    actions: riskLevel === 'safe' ? [localized(language, 'safeAction')] : localized(language, 'scamActions'),
    safe_reasons: riskLevel === 'safe' ? [strings.safeReason] : [],
    source: 'rules',
  };
}

/** Live Call Guard fallback with the same shape as the AI live analysis. */
export function analyzeLiveCallWithRules(transcript, language = 'en') {
  const { matches, score, riskLevel, scamType } = evaluateRules(transcript, language);
  const adviceKey = { safe: 'liveSafeAdvice', suspicious: 'liveSuspiciousAdvice', scam: 'liveScamAdvice' }[riskLevel];

  return {
    risk_level: riskLevel,
    risk_score: score,
    scam_type: scamType,
    triggers: matches.slice(0, 8).map(({ evidence, explanation }) => ({ phrase: evidence, why: explanation })),
    advice: localized(language, adviceKey),
    say_this: localized(language, riskLevel === 'safe' ? 'liveSafeSayThis' : 'liveScamSayThis'),
    source: 'rules',
  };
}
