/**
 * Production-ready mock backend for ScamShield with fictional Indian demo scam data.
 * Persists changes in localStorage (with in-memory fallback for test runners)
 * so demo interactions behave like a live database.
 */

const STORAGE_KEYS = {
  USER: 'scamshield_user',
  TOKEN: 'scamshield_token',
  SCANS: 'scamshield_scans',
  ALERTS: 'scamshield_alerts',
  REPORTS: 'scamshield_reports',
  GUARDIANS: 'scamshield_guardians',
  LOOKUPS: 'scamshield_lookups'
};

// Clearly fictional demo user
const SEED_USER = {
  id: 'usr_default_01',
  name: 'Aarav Patel',
  email: 'aarav.patel@example.com',
  preferred_language: 'en',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
};

const SEED_SCANS = [
  {
    id: 'scan_001',
    input_type: 'text',
    message_text: 'Dear Customer, your electricity power will be DISCONNECTED tonight at 9:30 PM from the electricity office because your previous month bill was not updated. Please immediately contact our electricity officer Rahul Sharma at 0000000001. Thank you.',
    risk_level: 'scam',
    risk_score: 94,
    scam_type: 'electricity_bill',
    summary: 'Fraudulent electricity disconnection threat designed to induce panic and force an unauthorized APK download or UPI transfer.',
    explanation: 'State electricity boards (BESCOM, TNEB, MSEDCL, Tata Power) never send disconnection notices via personal 10-digit mobile numbers with immediate 9:30 PM deadlines. Disconnections require official 15-day formal notices.',
    red_flags: [
      {
        flag: 'Artificial Urgency & Panic',
        evidence: 'DISCONNECTED tonight at 9:30 PM',
        explanation: 'Electricity providers never disconnect power without formal written notice. Immediate night cutoff is a classic extortion tactic.'
      },
      {
        flag: 'Unverified Personal Mobile Number',
        evidence: 'officer Rahul Sharma at 0000000001',
        explanation: 'Official disconnections are handled through registered electricity board portals or sub-division offices, never via personal WhatsApp or mobile numbers.'
      },
      {
        flag: 'Threat of Service Termination',
        evidence: 'because your previous month bill was not updated',
        explanation: 'Scammers aim to trick you into calling them directly where they instruct you to install remote-access apps (AnyDesk, TeamViewer) or send a small ₹10 test transfer.'
      }
    ],
    safe_reasons: [],
    actions: [
      'Do not call +91 00000 00001 or reply to this message.',
      'Check your official electricity provider app or website to verify bill status.',
      'Never install any .apk or QuickSupport apps suggested by the caller.',
      'Report this number on the Chakshu portal / cybercrime.gov.in.'
    ],
    identifiers: {
      phones: ['+91 00000 00001'],
      upi_ids: [],
      urls: [],
      emails: []
    },
    community_matches: [
      {
        identifier_type: 'phone',
        identifier_value: '+91 00000 00001',
        report_count: 42,
        last_7_days_count: 18
      }
    ],
    language: 'en',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'scan_002',
    input_type: 'call',
    message_text: 'DCP Rajesh Kumar speaking from Mumbai Police Crime Branch. A consignment containing 140 grams MDMA was intercepted at Mumbai airport under your Aadhaar. You are placed under digital arrest. Do not disconnect the phone and join Skype immediately for interrogation.',
    risk_level: 'scam',
    risk_score: 98,
    scam_type: 'digital_arrest',
    summary: 'High-severity "Digital Arrest" impersonation scam by fraudsters posing as Mumbai Police / CBI.',
    explanation: 'Law enforcement agencies, CBI, and Police never conduct "digital arrests" over Skype, WhatsApp video, or phone calls. Indian law has no provision for "Digital Arrest". Government agencies never order money transfers to verify bank accounts.',
    red_flags: [
      {
        flag: 'Non-existent "Digital Arrest" Claim',
        evidence: 'You are placed under digital arrest',
        explanation: 'The Supreme Court and Ministry of Home Affairs (MHA) have repeatedly clarified that "Digital Arrest" is 100% illegal and bogus.'
      },
      {
        flag: 'Video Interrogation via Skype/WhatsApp',
        evidence: 'join Skype immediately for interrogation',
        explanation: 'Indian police and judicial courts never conduct formal interrogations or arrest proceedings via consumer video apps.'
      },
      {
        flag: 'Intimidation and Secrecy',
        evidence: 'Do not disconnect the phone',
        explanation: 'Scammers keep victims trapped on the line to prevent them from consulting family members or verifying with local police.'
      }
    ],
    safe_reasons: [],
    actions: [
      'Hang up immediately! You are in zero legal danger.',
      'Dial 1930 immediately to report the caller to National Cyber Crime Reporting Portal.',
      'Inform your local police station if they persist with WhatsApp threats.',
      'Never transfer funds to any "Supreme Court / RBI escrow account".'
    ],
    identifiers: {
      phones: ['+91 00000 00002'],
      upi_ids: [],
      urls: [],
      emails: []
    },
    community_matches: [
      {
        identifier_type: 'phone',
        identifier_value: '+91 00000 00002',
        report_count: 89,
        last_7_days_count: 34
      }
    ],
    language: 'en',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString()
  },
  {
    id: 'scan_003',
    input_type: 'image',
    message_text: 'Dear SBI User, your YONO account has been BLOCKED due to incomplete PAN KYC. Please click here to unblock your net banking: https://sbi-kyc-update.example/login. Failure will lead to permanent account suspension.',
    risk_level: 'scam',
    risk_score: 96,
    scam_type: 'kyc_bank',
    summary: 'Phishing attack mimicking State Bank of India with a fraudulent URL aimed at stealing net banking credentials and OTPs.',
    explanation: 'SBI strictly uses "sbi.co.in" or official YONO app. Any link ending in ".example", ".online", ".xyz", ".top", or ".site" is a malicious phishing website created to harvest your internet banking username, password, and OTP.',
    red_flags: [
      {
        flag: 'Malicious Phishing Domain',
        evidence: 'https://sbi-kyc-update.example/login',
        explanation: 'Official SBI domains end in sbi.co.in. The domain .example was created for demonstration.'
      },
      {
        flag: 'Panic-inducing Suspension Warning',
        evidence: 'Failure will lead to permanent account suspension',
        explanation: 'Banks never deactivate bank accounts suddenly without registered postal letters and official branch notifications.'
      }
    ],
    safe_reasons: [],
    actions: [
      'Do not click the link or enter your SBI username/password/OTP.',
      'Forward the SMS to official bank cyber fraud helpline.',
      'If you already entered details, call your bank customer care immediately to freeze net banking.'
    ],
    identifiers: {
      phones: [],
      upi_ids: [],
      urls: ['https://sbi-kyc-update.example/login'],
      emails: []
    },
    community_matches: [
      {
        identifier_type: 'url',
        identifier_value: 'sbi-kyc-update.example',
        report_count: 173,
        last_7_days_count: 78
      }
    ],
    language: 'en',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'scan_004',
    input_type: 'text',
    message_text: 'Earn ₹3000 to ₹8000 daily by simply liking YouTube videos and rating Google Maps hotels. No experience required. Work from home 30 minutes daily. Contact HR Priya on Telegram: @GlobalTaskHR77 for instant ₹500 joining bonus.',
    risk_level: 'scam',
    risk_score: 91,
    scam_type: 'job_task',
    summary: 'Task-based prepaid investment scam operating through Telegram masquerading as easy work-from-home employment.',
    explanation: 'Scammers pay ₹150–₹500 for the first 2 tasks to build trust, then trap victims in "prepaid crypto/merchant recharge tasks" requiring ₹10,000 to ₹5,00,000 deposits that can never be withdrawn.',
    red_flags: [
      {
        flag: 'Unrealistic Pay for Trivial Tasks',
        evidence: 'Earn ₹3000 to ₹8000 daily by simply liking YouTube videos',
        explanation: 'No legitimate brand or enterprise pays thousands of rupees for simply tapping the like button.'
      },
      {
        flag: 'Communication Restricted to Telegram',
        evidence: 'Contact HR Priya on Telegram: @GlobalTaskHR77',
        explanation: 'Scammers use Telegram because accounts are anonymous and chat histories can be deleted remotely.'
      }
    ],
    safe_reasons: [],
    actions: [
      'Block and report the Telegram username @GlobalTaskHR77 immediately.',
      'Do not send any registration fee or prepaid security deposit.',
      'Do not share your bank account or UPI details for "instant bonus".'
    ],
    identifiers: {
      phones: [],
      upi_ids: [],
      urls: [],
      emails: []
    },
    community_matches: [
      {
        identifier_type: 'url',
        identifier_value: '@GlobalTaskHR77',
        report_count: 28,
        last_7_days_count: 14
      }
    ],
    language: 'en',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'scan_005',
    input_type: 'text',
    message_text: 'Your delivery order #9823101 has been picked up by delivery partner. Track live delivery on your app. OTP for delivery is 4821.',
    risk_level: 'safe',
    risk_score: 5,
    scam_type: 'none',
    summary: 'Standard food delivery notification with legitimate order tracking information.',
    explanation: 'Contains normal operational transactional text with no external links, no requests for payment, and legitimate delivery pin instructions.',
    red_flags: [],
    safe_reasons: [
      'No external suspicious URLs or APK download links.',
      'Standard 4-digit physical delivery PIN, not a banking transaction OTP.',
      'Does not ask you to call personal numbers or install remote screen-sharing tools.'
    ],
    actions: [
      'Safe to proceed. Share the 4-digit PIN only with the delivery partner upon receiving food.'
    ],
    identifiers: {
      phones: [],
      upi_ids: [],
      urls: [],
      emails: []
    },
    community_matches: [],
    language: 'en',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
  }
];

const SEED_ALERTS = [
  {
    id: 'alt_001',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    person: {
      name: 'Amma (Mother)',
      email: 'amma.patel@example.com'
    },
    scan: {
      id: 'scan_002',
      summary: 'DCP Crime Branch impersonation alleging illegal drugs parcel under Aadhaar',
      risk_score: 98,
      risk_level: 'scam',
      scam_type: 'digital_arrest',
      input_type: 'call'
    }
  },
  {
    id: 'alt_002',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    person: {
      name: 'Dad',
      email: 'suresh.patel@example.com'
    },
    scan: {
      id: 'scan_001',
      summary: 'Fake Electricity disconnect warning demanding urgent call',
      risk_score: 94,
      risk_level: 'scam',
      scam_type: 'electricity_bill',
      input_type: 'text'
    }
  }
];

const SEED_GUARDIANS = {
  my_guardians: [
    {
      id: 'grd_001',
      status: 'active',
      other_user: {
        id: 'usr_g1',
        name: 'Rohan Patel (Brother)',
        email: 'rohan.patel@example.com'
      }
    }
  ],
  people_i_protect: [
    {
      id: 'grd_002',
      status: 'active',
      other_user: {
        id: 'usr_p1',
        name: 'Suresh Patel (Dad)',
        email: 'suresh.patel@example.com'
      }
    },
    {
      id: 'grd_003',
      status: 'active',
      other_user: {
        id: 'usr_p2',
        name: 'Kavita Patel (Amma)',
        email: 'amma.patel@example.com'
      }
    }
  ],
  pending_invites_for_me: [
    {
      id: 'grd_inv_01',
      status: 'pending',
      other_user: {
        id: 'usr_uncle',
        name: 'Mahesh Uncle',
        email: 'mahesh.k@example.com'
      }
    }
  ]
};

const SEED_LOOKUPS = {
  '0000000001': {
    identifier_type: 'phone',
    identifier_value: '+910000000001',
    report_count: 94,
    last_7_days_count: 42,
    scam_types: ['digital_arrest', 'delivery_courier'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    verdict: 'reported'
  },
  '0000000002': {
    identifier_type: 'phone',
    identifier_value: '+910000000002',
    report_count: 52,
    last_7_days_count: 21,
    scam_types: ['electricity_bill', 'kyc_bank'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    verdict: 'reported'
  },
  '0000000003': {
    identifier_type: 'phone',
    identifier_value: '+910000000003',
    report_count: 18,
    last_7_days_count: 6,
    scam_types: ['job_task'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    verdict: 'reported'
  },
  '0000000004': {
    identifier_type: 'phone',
    identifier_value: '+910000000004',
    report_count: 11,
    last_7_days_count: 3,
    scam_types: ['loan_app'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    verdict: 'reported'
  },
  'kyc.refund.demo@oksbi': {
    identifier_type: 'upi',
    identifier_value: 'kyc.refund.demo@oksbi',
    report_count: 84,
    last_7_days_count: 36,
    scam_types: ['kyc_bank', 'upi_payment_request'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    verdict: 'reported'
  },
  'sbi-kyc-update.example': {
    identifier_type: 'url',
    identifier_value: 'sbi-kyc-update.example',
    report_count: 173,
    last_7_days_count: 78,
    scam_types: ['kyc_bank', 'phishing_link'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    verdict: 'reported'
  },
  'parcel-customs-fee.example': {
    identifier_type: 'url',
    identifier_value: 'parcel-customs-fee.example',
    report_count: 37,
    last_7_days_count: 12,
    scam_types: ['delivery_courier'],
    last_reported_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    verdict: 'reported'
  }
};

// Storage helper with in-memory fallback for test runners
const memoryStore = {};

function loadStorage(key, fallback) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    }
    return memoryStore[key] ? JSON.parse(memoryStore[key]) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveStorage(key, data) {
  try {
    const serialized = JSON.stringify(data);
    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, serialized);
    }
    memoryStore[key] = serialized;
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

// Extraction utility for numbers, URLs, UPIs
export function extractIdentifiers(text = '') {
  const phones = [];
  const upi_ids = [];
  const urls = [];
  const emails = [];

  // Match Indian phone numbers: +91 xxxxx xxxxx or 10-digit starting 6-9, or demo numbers like 0000000001
  const phoneRegex = /(?:\+91[\-\s]?)?(?:[6-9]\d{9}|00000[\s\-]?0000[0-9])\b/g;
  let pMatch;
  while ((pMatch = phoneRegex.exec(text)) !== null) {
    if (!phones.includes(pMatch[0])) phones.push(pMatch[0]);
  }

  // Match UPI handles: name@bank or name@demoupi
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  let uMatch;
  while ((uMatch = upiRegex.exec(text)) !== null) {
    if (!uMatch[0].includes('.com') && !upi_ids.includes(uMatch[0])) {
      upi_ids.push(uMatch[0]);
    }
  }

  // Match URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(example|online|xyz|top|site|cc|info|biz|tk|ml)\b[^\s]*)/gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    if (!urls.includes(urlMatch[0])) urls.push(urlMatch[0]);
  }

  return { phones, upi_ids, urls, emails };
}

// Intelligent heuristic mock scan analyzer
export function analyzeContentHeuristic(text = '', language = 'en') {
  const lower = text.toLowerCase();
  const identifiers = extractIdentifiers(text);

  let riskScore = 12;
  let riskLevel = 'safe';
  let scamType = 'safe_message';
  const redFlags = [];
  const safeReasons = [];
  const communityMatches = [];

  // Check lookup database for identifiers
  const lookups = loadStorage(STORAGE_KEYS.LOOKUPS, SEED_LOOKUPS);
  for (const phone of identifiers.phones) {
    const cleaned = phone.replace(/[^0-9]/g, '').slice(-10);
    if (lookups[cleaned]) {
      communityMatches.push({
        identifier_type: 'phone',
        identifier_value: phone,
        report_count: lookups[cleaned].report_count,
        last_7_days_count: lookups[cleaned].last_7_days_count
      });
      riskScore = Math.max(riskScore, 90);
    }
  }

  for (const upi of identifiers.upi_ids) {
    if (lookups[upi]) {
      communityMatches.push({
        identifier_type: 'upi',
        identifier_value: upi,
        report_count: lookups[upi].report_count,
        last_7_days_count: lookups[upi].last_7_days_count
      });
      riskScore = Math.max(riskScore, 92);
    }
  }

  for (const url of identifiers.urls) {
    const cleanUrl = url.replace(/^https?:\/\//, '').split('/')[0];
    if (lookups[cleanUrl] || lookups[url]) {
      const match = lookups[cleanUrl] || lookups[url];
      communityMatches.push({
        identifier_type: 'url',
        identifier_value: url,
        report_count: match.report_count,
        last_7_days_count: match.last_7_days_count
      });
      riskScore = Math.max(riskScore, 95);
    }
  }

  // Pattern checks
  if (
    lower.includes('digital arrest') ||
    (lower.includes('cbi') && (lower.includes('parcel') || lower.includes('narcotics') || lower.includes('arrest') || lower.includes('police'))) ||
    (lower.includes('skype') && lower.includes('police')) ||
    (lower.includes('mdma') || lower.includes('customs') && lower.includes('aadhaar'))
  ) {
    riskScore = 98;
    riskLevel = 'scam';
    scamType = 'digital_arrest';
    redFlags.push({
      flag: 'Bogus Digital Arrest Intimidation',
      evidence: text.match(/digital arrest|police|narcotics|warrant/i)?.[0] || 'Digital arrest claim',
      explanation: 'Police and Supreme Court never conduct arrests over Skype or phone calls.'
    });
    redFlags.push({
      flag: 'Forced Isolation & Secrecy',
      evidence: 'Do not disconnect the call / inform family',
      explanation: 'Scammers forbid you from telling relatives so nobody exposes their scam.'
    });
  } else if (
    lower.includes('electricity') ||
    lower.includes('power will be disconnected') ||
    lower.includes('bill was not updated') ||
    lower.includes('bijli') ||
    lower.includes('bescom') ||
    lower.includes('tneb')
  ) {
    riskScore = 94;
    riskLevel = 'scam';
    scamType = 'electricity_bill';
    redFlags.push({
      flag: 'Fake Electricity Disconnection Panic',
      evidence: 'power will be DISCONNECTED tonight',
      explanation: 'Disconnections are never executed instantly by calling a random mobile number.'
    });
    redFlags.push({
      flag: 'Unverified Officer Mobile Contact',
      evidence: identifiers.phones[0] || '10-digit mobile number',
      explanation: 'Government utility boards never direct customers to call personal mobile numbers.'
    });
  } else if (
    (lower.includes('sbi') || lower.includes('yono') || lower.includes('hdfc') || lower.includes('pan') || lower.includes('kyc')) &&
    (lower.includes('blocked') || lower.includes('suspended') || lower.includes('update') || identifiers.urls.length > 0)
  ) {
    riskScore = 96;
    riskLevel = 'scam';
    scamType = 'bank_kyc';
    redFlags.push({
      flag: 'Fake Bank KYC Phishing Link',
      evidence: identifiers.urls[0] || 'Unverified banking update link',
      explanation: 'Banks never ask you to update PAN cards or KYC via SMS links.'
    });
    redFlags.push({
      flag: 'Account Blocking Threats',
      evidence: 'account blocked / suspended',
      explanation: 'Designed to provoke instant panic so you reveal internet banking passwords and OTP.'
    });
  } else if (
    lower.includes('part-time') ||
    lower.includes('part time') ||
    lower.includes('like youtube') ||
    lower.includes('telegram') ||
    lower.includes('daily earn') ||
    lower.includes('work from home') && lower.includes('bonus')
  ) {
    riskScore = 92;
    riskLevel = 'scam';
    scamType = 'part_time_job';
    redFlags.push({
      flag: 'Task-Based Prepaid Scam',
      evidence: 'Earn ₹3000 to ₹8000 daily by simply liking YouTube videos',
      explanation: 'Victims are asked to deposit thousands into fake crypto or merchant portals to "unlock" payouts.'
    });
  } else if (
    lower.includes('lottery') ||
    lower.includes('kbc') ||
    lower.includes('won 25 lakh') ||
    lower.includes('lucky draw')
  ) {
    riskScore = 90;
    riskLevel = 'scam';
    scamType = 'lottery_kbc';
    redFlags.push({
      flag: 'Non-existent Lottery / Prize Claim',
      evidence: 'Lucky winner 25 Lakhs',
      explanation: 'Scammers demand processing fees, GST, or income tax before vanishing with your funds.'
    });
  } else if (riskScore < 50) {
    riskScore = Math.floor(Math.random() * 10) + 5;
    riskLevel = 'safe';
    scamType = 'safe_message';
    safeReasons.push('No malicious external links or APK downloads detected.');
    safeReasons.push('Standard informational language without emotional blackmail or sudden panic.');
    safeReasons.push('Zero community abuse reports against the sender numbers.');
  } else {
    riskLevel = riskScore >= 80 ? 'scam' : 'suspicious';
  }

  // Generate localized summaries
  let summary = 'Suspicious interaction flagged with potential fraud characteristics.';
  let explanation = 'Please exercise extreme caution. Do not transfer funds or share sensitive OTPs.';
  let actions = [
    'Do not click any unknown links or install apps.',
    'Never share bank OTP or UPI PIN.',
    'Verify independently using official customer care numbers.'
  ];

  if (scamType === 'electricity_bill') {
    if (language === 'hi') {
      summary = 'फर्जी बिजली बिल कटने की धमकी। यह आपको कॉल करके पैसे ठगने की चाल है।';
      explanation = 'बिजली विभाग कभी भी अचानक लाइन काटने का मैसेज नहीं भेजता। न ही किसी निजी मोबाइल नंबर पर कॉल करने को कहता है।';
      actions = [
        'इस नंबर पर कॉल या मैसेज बिल्कुल न करें।',
        'बिजली कंपनी की आधिकारिक ऐप या वेबसाइट पर जाकर बिल चेक करें।',
        'कोई भी ऐप डाउनलोड न करें।'
      ];
    } else if (language === 'kn') {
      summary = 'ವಿದ್ಯುತ್ ಕಡಿತಗೊಳಿಸುವ ನಕಲಿ ಬೆದರಿಕೆ. ಹಣ ವಂಚಿಸಲು ಕಳುಹಿಸಲಾದ ಸಂದೇಶ.';
      explanation = 'ವಿದ್ಯುತ್ ಇಲಾಖೆಗಳು ತಕ್ಷಣವೇ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸುವಂತೆ ವೈಯಕ್ತಿಕ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗಳಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸುವುದಿಲ್ಲ.';
      actions = [
        'ಈ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಬೇಡಿ ಅಥವಾ ಉತ್ತರಿಸಬೇಡಿ.',
        'ನಿಮ್ಮ ಅಧಿಕೃತ ವಿದ್ಯುತ್ ಕಂಪನಿಯ ಆ್ಯಪ್ ಮೂಲಕ ಬಿಲ್ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ.'
      ];
    } else {
      summary = 'Fraudulent electricity disconnection notice designed to induce panic.';
      explanation = 'Electricity boards never send urgent disconnection threats via personal 10-digit mobile numbers.';
      actions = [
        'Do not call the mobile number in the message.',
        'Check bill status on your electricity provider official website or app.',
        'Never install screen-sharing apps like AnyDesk.'
      ];
    }
  } else if (scamType === 'digital_arrest') {
    if (language === 'hi') {
      summary = 'फर्जी पुलिस / डिजिटल अरेस्ट की खतरनाक धमकी। कानून में ऐसा कोई अरेस्ट नहीं होता।';
      explanation = 'सीबीआई, पुलिस या कस्टम्स अधिकारी कभी भी स्काइप या व्हाट्सएप वीडियो कॉल पर पूछताछ या अरेस्ट नहीं करते।';
      actions = [
        'तुरंत फोन काट दें! आप पर कोई कानूनी खतरा नहीं है।',
        'तुरंत 1930 डायल करके साइबर हेल्पलाइन पर शिकायत दर्ज करें।',
        'किसी भी सरकारी खाते के नाम पर पैसे न भेजें।'
      ];
    } else if (language === 'kn') {
      summary = 'ನಕಲಿ ಪೊಲೀಸ್ ಅಥವಾ ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ವಂಚನೆ. ಕಾನೂನಿನಲ್ಲಿ ಇಂತಹ ಯಾವುದೇ ಬಂಧನವಿಲ್ಲ.';
      explanation = 'ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ಎಂದಿಗೂ ವಿಡಿಯೋ ಕರೆಗಳ ಮೂಲಕ ಬಂಧನ ಅಥವಾ ಹಣದ ವರ್ಗಾವಣೆಯನ್ನು ಆದೇಶಿಸುವುದಿಲ್ಲ.';
      actions = [
        'ತಕ್ಷಣ ಕರೆ ಕಟ್ ಮಾಡಿ! ಯಾವುದೇ ಭಯಪಡುವ ಅಗತ್ಯವಿಲ್ಲ.',
        'ಸಹಾಯವಾಣಿ 1930 ಗೆ ಕರೆ ಮಾಡಿ ದೂರು ನೀಡಿ.'
      ];
    } else {
      summary = 'Fake Digital Arrest intimidation scam impersonating police or CBI officials.';
      explanation = 'Law enforcement agencies never conduct "digital arrests" or ask for financial escrow deposits over calls.';
      actions = [
        'Hang up immediately! You are in zero legal danger.',
        'Dial 1930 to report this caller to the National Cyber Crime portal.',
        'Never transfer your savings to any escrow verification account.'
      ];
    }
  } else if (scamType === 'bank_kyc' || scamType === 'kyc_bank') {
    if (language === 'hi') {
      summary = 'एसबीआई / बैंक केवाईसी (KYC) फ़िशिंग धोखाधड़ी जो आपके नेट बैंकिंग पासवर्ड और ओटीपी चुराने के लिए बनाई गई है।';
      explanation = 'कोई भी बैंक कभी भी एसएमएस या व्हाट्सएप लिंक भेजकर पैन, आधार या पासवर्ड अपडेट करने को नहीं कहता।';
      actions = [
        'किसी भी अनजान लिंक पर क्लिक न करें और अपना पासवर्ड या ओटीपी दर्ज न करें।',
        'केवल बैंक की आधिकारिक ऐप या शाखा में जाकर ही केवाईसी की जांच करें।',
        'यदि जानकारी साझा कर दी है, तो तुरंत बैंक हेल्पलाइन और 1930 पर कॉल करें।'
      ];
    } else if (language === 'kn') {
      summary = 'ನಿಮ್ಮ ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್ ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತು OTP ಕದಿಯಲು ರೂಪಿಸಲಾದ ನಕಲಿ ಬ್ಯಾಂಕ್ KYC ಫಿಶಿಂಗ್ ವಂಚನೆ.';
      explanation = 'ಬ್ಯಾಂಕ್‌ಗಳು ಎಂದಿಗೂ SMS ಅಥವಾ ವಾಟ್ಸಾಪ್ ಲಿಂಕ್ ಮೂಲಕ ಪ್ಯಾನ್, ಆಧಾರ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಲು ಕೇಳುವುದಿಲ್ಲ.';
      actions = [
        'ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಬೇಡಿ.',
        'ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಆ್ಯಪ್ ಅಥವಾ ಶಾಖೆಯ ಮೂಲಕ ಮಾತ್ರ ಪರಿಶೀಲಿಸಿ.',
        'ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದರೆ ತಕ್ಷಣ ಬ್ಯಾಂಕ್ ಮತ್ತು 1930 ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ.'
      ];
    } else {
      summary = 'SBI / Bank KYC phishing scam designed to steal your net banking login and OTP.';
      explanation = 'Banks will never send links asking you to submit PAN, Aadhaar, or passwords via SMS.';
      actions = [
        'Do not click the link or enter banking passwords.',
        'Check your balance directly on official bank apps only.',
        'Call your official bank customer care if you shared details.'
      ];
    }
  } else if (scamType === 'part_time_job' || scamType === 'job_task') {
    if (language === 'hi') {
      summary = 'टेलीग्राम और यूट्यूब लाइक के नाम पर पार्ट-टाइम जॉब और प्रीपेड टास्क धोखाधड़ी।';
      explanation = 'ठग शुरू में 150-500 रुपये देकर भरोसा जीतते हैं और फिर बड़े टास्क के नाम पर हजारों रुपये जमा करवाकर ब्लॉक कर देते हैं।';
      actions = [
        'टेलीग्राम आईडी को तुरंत ब्लॉक और रिपोर्ट करें।',
        'कमाई निकालने या रजिस्ट्रेशन के नाम पर कोई पैसा न भेजें।',
        'बोनस के लालच में अपनी बैंक जानकारी साझा न करें।'
      ];
    } else if (language === 'kn') {
      summary = 'ಟೆಲಿಗ್ರಾಮ್ ಮತ್ತು ಯೂಟ್ಯೂಬ್ ಲೈಕ್ ಹೆಸರಿನಲ್ಲಿ ನಡೆಯುವ ಪಾರ್ಟ್-ಟೈಮ್ ಉದ್ಯೋಗ ಮತ್ತು ಪ್ರಿಪೇಯ್ಡ್ ಟಾಸ್ಕ್ ವಂಚನೆ.';
      explanation = 'ವಂಚಕರು ಮೊದಲು ಸಣ್ಣ ಮೊತ್ತವನ್ನು ನೀಡಿ ನಂಬಿಕೆ ಗಳಿಸುತ್ತಾರೆ, ನಂತರ ಹೆಚ್ಚಿನ ಹಣ ಹೂಡಿಕೆ ಮಾಡಿಸಿ ಮೋಸ ಮಾಡುತ್ತಾರೆ.';
      actions = [
        'ಟೆಲಿಗ್ರಾಮ್ ಖಾತೆಯನ್ನು ತಕ್ಷಣ ಬ್ಲಾಕ್ ಮಾಡಿ ಮತ್ತು ವರದಿ ಮಾಡಿ.',
        'ನೋಂದಣಿ ಶುಲ್ಕ ಅಥವಾ ಪ್ರಿಪೇಯ್ಡ್ ಟಾಸ್ಕ್ ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ಹಣ ಕಳುಹಿಸಬೇಡಿ.'
      ];
    } else {
      summary = 'Task-based prepaid investment scam operating through Telegram masquerading as easy work-from-home employment.';
      explanation = 'Scammers pay small initial amounts to build trust, then trap victims in prepaid tasks requiring large deposits that cannot be withdrawn.';
      actions = [
        'Block and report the Telegram account immediately.',
        'Do not send any registration fee or prepaid security deposit.',
        'Do not share your bank account or UPI details for joining bonuses.'
      ];
    }
  } else if (scamType === 'safe_message') {
    summary = 'Normal legitimate communication with standard operational details.';
    explanation = 'The text does not show any signs of phishing, extortion, or suspicious financial demands.';
    actions = [
      'Looks safe. Standard precautions apply: never share banking OTPs.'
    ];
  }

  return {
    risk_level: riskLevel,
    risk_score: riskScore,
    scam_type: scamType,
    summary,
    explanation,
    red_flags: redFlags,
    safe_reasons: safeReasons,
    actions,
    identifiers,
    community_matches: communityMatches,
    language
  };
}

// Live Call Analysis Heuristic (star feature)
export function analyzeLiveCallHeuristic(transcript = '', language = 'en') {
  const lower = transcript.toLowerCase();
  const triggers = [];
  let riskScore = 15;
  let riskLevel = 'safe';
  let scamType = 'safe_message';
  let advice = 'The caller appears to be having a regular conversation.';
  let sayThis = 'Hello, how can I help you?';

  if (
    lower.includes('digital arrest') ||
    lower.includes('डिजिटल अरेस्ट') ||
    lower.includes('ಡಿಜಿಟಲ್ ಬಂಧನ') ||
    lower.includes('ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್') ||
    lower.includes('parcel') ||
    lower.includes('पार्सल') ||
    lower.includes('ಪಾರ್ಸೆಲ್') ||
    lower.includes('narcotics') ||
    lower.includes('customs') ||
    lower.includes('कस्टम्स') ||
    lower.includes('skype') ||
    lower.includes('स्काइप') ||
    lower.includes('pmla') ||
    lower.includes('supreme court') ||
    lower.includes('rbi safe') ||
    lower.includes('inspector') ||
    lower.includes('इंस्पेक्टर') ||
    lower.includes('cbi') ||
    lower.includes('सीबीआई') ||
    lower.includes('ಸಿಬಿಐ') ||
    lower.includes('cyber crime') ||
    lower.includes('साइबर क्राइम')
  ) {
    riskScore = 98;
    riskLevel = 'scam';
    scamType = 'digital_arrest';

    if (lower.includes('digital arrest') || lower.includes('डिजिटल अरेस्ट') || lower.includes('ಡಿಜಿಟಲ್ ಬಂಧನ')) {
      triggers.push({
        phrase: lower.includes('डिजिटल अरेस्ट') ? 'डिजिटल अरेस्ट' : lower.includes('ಡಿಜಿಟಲ್ ಬಂಧನ') ? 'ಡಿಜಿಟಲ್ ಬಂಧನ' : 'digital arrest',
        why: 'Indian law has no provision for Digital Arrest. It is 100% fake.'
      });
    }
    if (lower.includes('parcel') || lower.includes('पार्सल') || lower.includes('ಪಾರ್ಸೆಲ್') || lower.includes('narcotics') || lower.includes('mdma') || lower.includes('ड्रग्स')) {
      triggers.push({
        phrase: lower.includes('पार्सल') ? 'पार्सल / ड्रग्स' : lower.includes('ಪಾರ್ಸೆಲ್') ? 'ಪಾರ್ಸೆಲ್' : 'parcel / narcotics',
        why: 'Scammers claim intercepted drug packages under your Aadhaar to induce terror.'
      });
    }
    if (lower.includes('skype') || lower.includes('स्काइप')) {
      triggers.push({
        phrase: 'connect on Skype',
        why: 'Police officers do not conduct video interrogations on consumer apps.'
      });
    }
    if (lower.includes('rbi safe') || lower.includes('transfer all your mutual funds') || lower.includes('verification account')) {
      triggers.push({
        phrase: 'transfer funds / RBI Safe account',
        why: 'The government never asks citizens to transfer money for verification.'
      });
    }

    if (language === 'hi') {
      advice = 'यह डिजिटल अरेस्ट का फ्रॉड कॉल है! कॉलर पुलिस अधिकारी का नाटक कर रहा है। तुरंत कॉल काटें!';
      sayThis = 'मैं सीधे अपने नजदीकी पुलिस स्टेशन जा रहा हूँ। मुझे दोबारा कॉल मत करना!';
    } else if (language === 'kn') {
      advice = 'ಇದು ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ ವಂಚನೆಯಾಗಿದೆ! ಕರೆ ಮಾಡಿದ ವ್ಯಕ್ತಿ ನಕಲಿ ಪೊಲೀಸ್. ತಕ್ಷಣ ಫೋನ್ ಕಟ್ ಮಾಡಿ!';
      sayThis = 'ನಾನು ಈಗಲೇ ಹತ್ತಿರದ ಪೊಲೀಸ್ ಠಾಣೆಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ. ನನಗೆ ಮತ್ತೆ ಕರೆ ಮಾಡಬೇಡಿ!';
    } else {
      advice = 'DANGER! This is an extortion scam impersonating police or CBI. Hang up now!';
      sayThis = 'I am disconnecting now and contacting my local police station directly.';
    }
  } else if (
    lower.includes('otp') ||
    lower.includes('anydesk') ||
    lower.includes('quicksupport') ||
    lower.includes('electricity') ||
    lower.includes('kyc update') ||
    lower.includes('send 10 rupees')
  ) {
    riskScore = 88;
    riskLevel = 'scam';
    scamType = 'electricity_bill';
    triggers.push({
      phrase: 'remote app / OTP / electricity',
      why: 'Fraudulent request for remote access or immediate payment.'
    });
    advice = 'Warning: The caller is attempting to gain remote control of your phone or steal OTP.';
    sayThis = 'I will verify this at the official branch office in person. Do not call again.';
  } else if (transcript.trim().split(/\s+/).length > 6) {
    riskScore = 20;
    riskLevel = 'safe';
    advice = 'Call seems normal so far. Continue monitoring.';
    sayThis = 'Yes, please continue.';
  }

  return {
    risk_level: riskLevel,
    risk_score: riskScore,
    scam_type: scamType,
    triggers,
    advice,
    sayThis,
    say_this: sayThis
  };
}

// Mock backend API router dispatcher
export const mockBackend = {
  // Auth
  signup: async ({ name, email, password, preferred_language = 'en' }) => {
    const user = {
      id: 'usr_' + Date.now(),
      name: name || 'User',
      email,
      preferred_language,
      created_at: new Date().toISOString()
    };
    const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
    saveStorage(STORAGE_KEYS.USER, user);
    saveStorage(STORAGE_KEYS.TOKEN, token);
    return { token, user };
  },

  login: async ({ email, password }) => {
    let user = loadStorage(STORAGE_KEYS.USER, null);
    if (!user || user.email !== email) {
      user = {
        ...SEED_USER,
        email: email || SEED_USER.email,
        name: email ? email.split('@')[0].replace(/\./g, ' ') : SEED_USER.name
      };
    }
    const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
    saveStorage(STORAGE_KEYS.USER, user);
    saveStorage(STORAGE_KEYS.TOKEN, token);
    return { token, user };
  },

  getMe: async () => {
    const user = loadStorage(STORAGE_KEYS.USER, SEED_USER);
    return { user };
  },

  updateMe: async ({ preferred_language }) => {
    const user = loadStorage(STORAGE_KEYS.USER, SEED_USER);
    user.preferred_language = preferred_language;
    saveStorage(STORAGE_KEYS.USER, user);
    return { user };
  },

  // Scans
  createScan: async ({ text, image, language = 'en' }) => {
    const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    const analysis = analyzeContentHeuristic(text || 'Uploaded screenshot analysis', language);

    const newScan = {
      id: 'scan_' + Date.now(),
      input_type: image ? 'image' : 'text',
      message_text: text || 'Analyzed screenshot content',
      ...analysis,
      created_at: new Date().toISOString()
    };

    scans.unshift(newScan);
    saveStorage(STORAGE_KEYS.SCANS, scans);

    // If high risk scam, trigger an alert for guardians
    if (newScan.risk_level === 'scam') {
      const alerts = loadStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);
      alerts.unshift({
        id: 'alt_' + Date.now(),
        is_read: false,
        created_at: new Date().toISOString(),
        person: {
          name: 'You (Aarav)',
          email: 'aarav.patel@example.com'
        },
        scan: {
          id: newScan.id,
          summary: newScan.summary,
          risk_score: newScan.risk_score,
          risk_level: newScan.risk_level,
          scam_type: newScan.scam_type,
          input_type: newScan.input_type
        }
      });
      saveStorage(STORAGE_KEYS.ALERTS, alerts);
    }

    return { scan: newScan };
  },

  getScans: async () => {
    const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    return {
      scans: scans.map(s => ({
        id: s.id,
        input_type: s.input_type,
        summary: s.summary,
        risk_level: s.risk_level,
        risk_score: s.risk_score,
        scam_type: s.scam_type,
        created_at: s.created_at
      }))
    };
  },

  getScanById: async (id) => {
    const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    const found = scans.find(s => s.id === id);
    if (!found) {
      throw { response: { status: 404, data: { error: { message: 'Scan not found', code: 'NOT_FOUND' } } } };
    }
    return { scan: found };
  },

  deleteScan: async (id) => {
    let scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    scans = scans.filter(s => s.id !== id);
    saveStorage(STORAGE_KEYS.SCANS, scans);
    return { success: true };
  },

  explainScan: async (id, language) => {
    const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    const scan = scans.find(s => s.id === id);
    if (!scan) {
      throw { response: { status: 404, data: { error: { message: 'Scan not found', code: 'NOT_FOUND' } } } };
    }
    const fresh = analyzeContentHeuristic(scan.message_text, language);
    return {
      explanation: fresh.explanation,
      summary: fresh.summary,
      red_flags: fresh.red_flags,
      actions: fresh.actions
    };
  },

  // Calls
  transcribeAudio: async ({ audioBlob, language = 'en' }) => {
    // Fictional sample transcription based on requested language
    let sampleText = "Inspector Rajesh here from Mumbai Crime Branch regarding your Aadhaar linked parcel.";
    if (language === 'hi') {
      sampleText = "मैं मुंबई पुलिस क्राइम ब्रांच से इंस्पेक्टर राजेश बोल रहा हूँ। आपके आधार से जुड़ा पार्सल मिला है।";
    } else if (language === 'kn') {
      sampleText = "ನಾನು ಮುಂಬೈ ಕ್ರೈಮ್ ಬ್ರಾಂಚ್ ಇನ್‌ಸ್ಪೆಕ್ಟರ್ ರಾಜೇಶ್ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆದ ಪಾರ್ಸೆಲ್ ಸಿಕ್ಕಿದೆ.";
    }

    // Check if audioBlob has size
    const size = audioBlob?.size ?? audioBlob?.byteLength;
    const hasData = typeof size === 'number' ? size > 0 : Boolean(audioBlob && Object.keys(audioBlob).length > 0);

    return {
      transcript: hasData ? sampleText : '',
      has_speech: Boolean(hasData),
      detected_language: language
    };
  },

  analyzeAudio: async ({ audioFile, language = 'en', save = false }) => {
    let transcript = "DCP Rajesh Kumar speaking from Mumbai Police Crime Branch. A consignment containing 140 grams MDMA was intercepted at Mumbai airport under your Aadhaar. You are placed under digital arrest. Do not disconnect the phone.";
    if (language === 'hi') {
      transcript = "डीसीपी राजेश कुमार बोल रहा हूँ मुंबई पुलिस क्राइम ब्रांच से। आपके आधार कार्ड पर 140 ग्राम एमडीएमए पार्सल पकड़ा गया है। आप डिजिटल अरेस्ट में हैं।";
    } else if (language === 'kn') {
      transcript = "ಮುಂಬೈ ಪೊಲೀಸ್ ಕ್ರೈಮ್ ಬ್ರಾಂಚ್‌ನಿಂದ ಡಿಸಿಪಿ ರಾಜೇಶ್ ಕುಮಾರ್. ನಿಮ್ಮ ಆಧಾರ್‌ನಲ್ಲಿ 140 ಗ್ರಾಂ ಎಂಡಿಎಂಎ ಪಾರ್ಸೆಲ್ ವಶಪಡಿಸಿಕೊಳ್ಳಲಾಗಿದೆ. ನೀವು ಡಿಜಿಟಲ್ ಬಂಧನದಲ್ಲಿದ್ದೀರಿ.";
    }

    const analysis = analyzeContentHeuristic(transcript, language);

    let scan = null;
    if (save) {
      const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
      scan = {
        id: 'scan_audio_' + Date.now(),
        input_type: 'call',
        message_text: transcript,
        ...analysis,
        created_at: new Date().toISOString()
      };
      scans.unshift(scan);
      saveStorage(STORAGE_KEYS.SCANS, scans);
    }

    return {
      transcript,
      has_speech: true,
      analysis,
      scan
    };
  },

  analyzeCall: async ({ transcript, language = 'en' }) => {
    const analysis = analyzeLiveCallHeuristic(transcript, language);
    return { analysis };
  },

  saveCall: async ({ transcript, language = 'en' }) => {
    const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    const analysis = analyzeContentHeuristic(transcript, language);

    const newScan = {
      id: 'scan_call_' + Date.now(),
      input_type: 'call',
      message_text: transcript,
      ...analysis,
      created_at: new Date().toISOString()
    };

    scans.unshift(newScan);
    saveStorage(STORAGE_KEYS.SCANS, scans);

    if (newScan.risk_level === 'scam') {
      const alerts = loadStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);
      alerts.unshift({
        id: 'alt_' + Date.now(),
        is_read: false,
        created_at: new Date().toISOString(),
        person: {
          name: 'Amma (Mother)',
          email: 'amma.patel@example.com'
        },
        scan: {
          id: newScan.id,
          summary: newScan.summary,
          risk_score: newScan.risk_score,
          risk_level: newScan.risk_level,
          scam_type: newScan.scam_type,
          input_type: 'call'
        }
      });
      saveStorage(STORAGE_KEYS.ALERTS, alerts);
    }

    return { scan: newScan };
  },

  // Lookup
  lookup: async (value) => {
    const lookups = loadStorage(STORAGE_KEYS.LOOKUPS, SEED_LOOKUPS);
    const cleaned = String(value || '').trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const plainNum = String(value || '').replace(/[^0-9]/g, '').slice(-10);

    const match = lookups[cleaned] || lookups[plainNum] || Object.values(lookups).find(l => {
      return l.identifier_value.toLowerCase().includes(cleaned) ||
        (plainNum && l.identifier_value.replace(/[^0-9]/g, '').endsWith(plainNum));
    });

    if (match) {
      return match;
    }

    // Determine type
    let type = 'phone';
    if (value.includes('@') && !value.includes('.com')) type = 'upi';
    else if (value.includes('http') || value.includes('.com') || value.includes('.in') || value.includes('.example')) type = 'url';

    return {
      identifier_type: type,
      identifier_value: value,
      report_count: 0,
      last_7_days_count: 0,
      scam_types: [],
      last_reported_at: null,
      verdict: 'not_reported'
    };
  },

  // Reports
  createReport: async ({ value, scam_type }) => {
    const reports = loadStorage(STORAGE_KEYS.REPORTS, []);
    const lookups = loadStorage(STORAGE_KEYS.LOOKUPS, SEED_LOOKUPS);

    const newReport = {
      id: 'rep_' + Date.now(),
      value,
      scam_type,
      created_at: new Date().toISOString()
    };
    reports.unshift(newReport);
    saveStorage(STORAGE_KEYS.REPORTS, reports);

    const cleaned = String(value || '').trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const plainNum = String(value || '').replace(/[^0-9]/g, '').slice(-10);
    const key = plainNum || cleaned;

    if (lookups[key]) {
      lookups[key].report_count += 1;
      lookups[key].last_7_days_count += 1;
      if (!lookups[key].scam_types.includes(scam_type)) {
        lookups[key].scam_types.push(scam_type);
      }
      lookups[key].last_reported_at = new Date().toISOString();
      lookups[key].verdict = 'reported';
    } else {
      let type = 'phone';
      if (value.includes('@')) type = 'upi';
      else if (value.includes('.') && (value.includes('http') || value.includes('.example') || value.includes('.com'))) type = 'url';

      lookups[key] = {
        identifier_type: type,
        identifier_value: value,
        report_count: 1,
        last_7_days_count: 1,
        scam_types: [scam_type],
        last_reported_at: new Date().toISOString(),
        verdict: 'reported'
      };
    }
    saveStorage(STORAGE_KEYS.LOOKUPS, lookups);

    return { report: newReport };
  },

  // Guardians
  getGuardians: async () => {
    return loadStorage(STORAGE_KEYS.GUARDIANS, SEED_GUARDIANS);
  },

  inviteGuardian: async ({ email }) => {
    const guardians = loadStorage(STORAGE_KEYS.GUARDIANS, SEED_GUARDIANS);
    const newInvite = {
      id: 'grd_' + Date.now(),
      status: 'pending',
      other_user: {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email
      }
    };
    guardians.my_guardians.push(newInvite);
    saveStorage(STORAGE_KEYS.GUARDIANS, guardians);
    return { invite: newInvite };
  },

  acceptGuardian: async (id) => {
    const guardians = loadStorage(STORAGE_KEYS.GUARDIANS, SEED_GUARDIANS);
    const inviteIndex = guardians.pending_invites_for_me.findIndex(i => i.id === id);
    if (inviteIndex !== -1) {
      const accepted = guardians.pending_invites_for_me.splice(inviteIndex, 1)[0];
      accepted.status = 'active';
      guardians.people_i_protect.push(accepted);
      saveStorage(STORAGE_KEYS.GUARDIANS, guardians);
      return { guardian: accepted };
    }
    return { guardian: { id, status: 'active' } };
  },

  deleteGuardian: async (id) => {
    const guardians = loadStorage(STORAGE_KEYS.GUARDIANS, SEED_GUARDIANS);
    guardians.my_guardians = guardians.my_guardians.filter(g => g.id !== id);
    guardians.people_i_protect = guardians.people_i_protect.filter(g => g.id !== id);
    guardians.pending_invites_for_me = guardians.pending_invites_for_me.filter(g => g.id !== id);
    saveStorage(STORAGE_KEYS.GUARDIANS, guardians);
    return { success: true };
  },

  // Alerts
  getAlerts: async () => {
    const alerts = loadStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);
    const unread_count = alerts.filter(a => !a.is_read).length;
    return { alerts, unread_count };
  },

  markAlertRead: async (id) => {
    const alerts = loadStorage(STORAGE_KEYS.ALERTS, SEED_ALERTS);
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.is_read = true;
      saveStorage(STORAGE_KEYS.ALERTS, alerts);
    }
    return { success: true };
  },

  // Trends
  getTrends: async () => {
    const scans = loadStorage(STORAGE_KEYS.SCANS, SEED_SCANS);
    const reports = loadStorage(STORAGE_KEYS.REPORTS, []);
    const lookups = loadStorage(STORAGE_KEYS.LOOKUPS, SEED_LOOKUPS);

    // Calculate real numbers from actual data records
    const totalScans = scans.length;
    const scamsCaught = scans.filter(s => s.risk_level === 'scam').length;
    const lookupReportsCount = Object.values(lookups).reduce((sum, item) => sum + (item.report_count || 0), 0);
    const totalReports = reports.length + lookupReportsCount;

    // Fictional distribution of scam types
    const last7Days = [
      { scam_type: 'digital_arrest', count: 42 },
      { scam_type: 'kyc_bank', count: 78 },
      { scam_type: 'upi_payment_request', count: 36 },
      { scam_type: 'electricity_bill', count: 21 },
      { scam_type: 'delivery_courier', count: 12 },
      { scam_type: 'job_task', count: 6 }
    ];

    const topReported = [
      { identifier_type: 'url', identifier_value: 'sbi-kyc-update.example', report_count: 173 },
      { identifier_type: 'phone', identifier_value: '+91 00000 *****', report_count: 94 },
      { identifier_type: 'upi', identifier_value: 'kyc.refund.demo@***', report_count: 84 },
      { identifier_type: 'phone', identifier_value: '+91 00000 *****', report_count: 52 },
      { identifier_type: 'url', identifier_value: 'parcel-customs-fee.example', report_count: 37 }
    ];

    return {
      total_scans: totalScans,
      scams_caught: scamsCaught,
      total_reports: totalReports,
      last_7_days: last7Days,
      top_reported: topReported
    };
  }
};
