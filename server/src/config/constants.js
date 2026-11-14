export const LANGUAGES = ['en', 'hi', 'kn'];

export const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  kn: 'Kannada (Kannada script)',
};

export const RISK_LEVELS = ['safe', 'suspicious', 'scam'];

export const SCAM_TYPES = [
  'kyc_bank',
  'job_task',
  'digital_arrest',
  'lottery_prize',
  'investment_trading',
  'upi_payment_request',
  'delivery_courier',
  'loan_app',
  'electricity_bill',
  'impersonation',
  'phishing_link',
  'sextortion',
  'other',
  'none',
];

// Score bands that each risk level must fall into.
export const RISK_BANDS = {
  safe: { min: 0, max: 30 },
  suspicious: { min: 31, max: 69 },
  scam: { min: 70, max: 100 },
};

export const MAX_STORED_MESSAGE_LENGTH = 2000;
export const MAX_INPUT_TEXT_LENGTH = 5000;

export const INPUT_TYPES = ['image', 'text', 'call'];

export const IDENTIFIER_TYPES = ['phone', 'upi', 'url'];

// Scam type names used by the web client that differ from the API's names.
export const SCAM_TYPE_ALIASES = {
  bank_kyc: 'kyc_bank',
  part_time_job: 'job_task',
  customs_courier: 'delivery_courier',
  lottery_kbc: 'lottery_prize',
};

// Scam types a community report can be filed under.
export const REPORTABLE_SCAM_TYPES = SCAM_TYPES.filter((type) => type !== 'none');

export const MAX_LIVE_TRANSCRIPT_LENGTH = 6000;
export const MAX_CALL_TRANSCRIPT_LENGTH = 20000;
