/**
 * Realistic Hindi-English "CBI Digital Arrest" script for Live Call Guard simulation demo.
 */
export const CBI_DIGITAL_ARREST_DEMO = [
  {
    speaker: 'Caller',
    text: "Hello? Is this speaking? Listen very carefully. I am Inspector R.K. Sharma calling from New Delhi Cyber Crime Branch Headquarters.",
    delay: 2000
  },
  {
    speaker: 'Caller',
    text: "A FedEx parcel sent to Malaysia containing 140 grams of illegal MDMA narcotics and five counterfeit passports was intercepted at Mumbai International Airport.",
    delay: 3500
  },
  {
    speaker: 'Caller',
    text: "This consignment is directly linked to your Aadhaar card and mobile number. A non-bailable arrest warrant has already been generated against your name under PMLA Section 420.",
    delay: 4000
  },
  {
    speaker: 'Caller',
    text: "Do NOT cut the phone! You are currently under Digital Arrest. If you disconnect, local police patrol team will reach your home address within 15 minutes to arrest you.",
    delay: 4500
  },
  {
    speaker: 'Caller',
    text: "Do not inform your family or friends, as this is a classified national security case. Now connect on Skype video call immediately for secret magistrate verification.",
    delay: 4500
  },
  {
    speaker: 'Caller',
    text: "To clear your bank accounts from freeze order, you must immediately transfer all your mutual funds and fixed deposits to the RBI Safe Escrow Account for financial audit verification.",
    delay: 5000
  }
];

// Helper to get raw word stream
export function getDemoWordStream() {
  const fullText = CBI_DIGITAL_ARREST_DEMO.map(item => item.text).join(' ');
  return fullText.split(' ');
}
