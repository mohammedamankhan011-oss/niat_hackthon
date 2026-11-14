-- ScamShield demo data
-- All demo accounts use the password: Demo@1234
--   asha@example.com   - senior citizen, protected by Ravi
--   ravi@example.com   - Asha's son, her accepted guardian
--   priya@example.com  - student, has a pending guardian invite to Ravi
-- Safe to run more than once: existing rows are left untouched.

insert into public.users (id, name, email, password_hash, preferred_language, created_at) values
  ('11111111-1111-4111-8111-111111111111', 'Asha Rao',     'asha@example.com',  '$2b$10$GEEDOM9gHaqLBWLKhjnT5O2emlqFv/PobJEwZaNxQkr1QFzkHVrc.', 'kn', now() - interval '20 days'),
  ('22222222-2222-4222-8222-222222222222', 'Ravi Rao',     'ravi@example.com',  '$2b$10$GEEDOM9gHaqLBWLKhjnT5O2emlqFv/PobJEwZaNxQkr1QFzkHVrc.', 'en', now() - interval '20 days'),
  ('33333333-3333-4333-8333-333333333333', 'Priya Sharma', 'priya@example.com', '$2b$10$GEEDOM9gHaqLBWLKhjnT5O2emlqFv/PobJEwZaNxQkr1QFzkHVrc.', 'hi', now() - interval '15 days')
on conflict do nothing;

insert into public.guardians (id, user_id, guardian_id, status, created_at) values
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'accepted', now() - interval '19 days'),
  ('aaaaaaa1-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'pending',  now() - interval '2 days')
on conflict do nothing;

insert into public.scans
  (id, user_id, input_type, message_text, risk_level, risk_score, scam_type, red_flags, summary, explanation, actions, safe_reasons, language, created_at)
values
  (
    'bbbbbbb1-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'text',
    'Dear Customer, your SBI account XXXXXXXX4521 will be BLOCKED today due to pending KYC. Update PAN immediately at http://sbi-kyc-update.in or call 98XXXXXX10.',
    'scam', 94, 'kyc_bank',
    '[
      {"flag": "Threat of account block", "evidence": "will be BLOCKED today", "explanation": "Banks never block your account through an SMS. Scammers create fear so you act fast."},
      {"flag": "Fake website link", "evidence": "http://sbi-kyc-update.in", "explanation": "This is not the official SBI website (onlinesbi.sbi). It is made to steal your details."},
      {"flag": "Urgency", "evidence": "Update PAN immediately", "explanation": "Rushing you is a common trick so that you do not stop and check."}
    ]'::jsonb,
    'This is a fake bank KYC message meant to steal your account details.',
    'This message pretends to be from SBI. It says your account will be blocked, to scare you. The link goes to a fake website, not the real bank. If you enter your details there, scammers can empty your account.',
    '["Do not click the link.", "Never share your OTP, PIN or password with anyone.", "Block and report the sender.", "If you already shared details or lost money, call 1930 immediately.", "Report it at cybercrime.gov.in.", "Check your account only on the official YONO SBI app or by visiting your branch."]'::jsonb,
    '[]'::jsonb,
    'en',
    now() - interval '1 day'
  ),
  (
    'bbbbbbb1-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'image',
    'This is CBI Officer Rajesh Sharma. A parcel in your name with illegal drugs was seized in Mumbai. You are under DIGITAL ARREST. Do not disconnect the video call or tell anyone. Transfer Rs 2,50,000 to RBI verification account XXXXXXXXXX7788 to clear your name.',
    'scam', 98, 'digital_arrest',
    '[
      {"flag": "Fake digital arrest", "evidence": "You are under DIGITAL ARREST", "explanation": "There is no such thing as a digital arrest in Indian law. Police never arrest anyone on a video call."},
      {"flag": "Secrecy demand", "evidence": "Do not disconnect the video call or tell anyone", "explanation": "Scammers keep you isolated so family cannot warn you."},
      {"flag": "Money demand", "evidence": "Transfer Rs 2,50,000 to RBI verification account", "explanation": "CBI, police and RBI never ask you to transfer money to clear your name."}
    ]'::jsonb,
    'Fake CBI digital arrest scam asking for money.',
    'Someone is pretending to be a CBI officer to frighten you. Real police or CBI never arrest people on a video call or ask for money. They want you scared and alone so you pay quickly. Cut the call and talk to your family now.',
    '["Disconnect the call immediately.", "Do not transfer any money.", "Tell a family member right away.", "Call 1930, the national cyber crime helpline.", "Report it at cybercrime.gov.in."]'::jsonb,
    '[]'::jsonb,
    'en',
    now() - interval '3 days'
  ),
  (
    'bbbbbbb1-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'text',
    'Dear consumer, your electricity power will be disconnected tonight at 9.30 pm because your previous month bill was not updated. Please contact our electricity officer.',
    'suspicious', 64, 'electricity_bill',
    '[
      {"flag": "Disconnection threat", "evidence": "will be disconnected tonight at 9.30 pm", "explanation": "Electricity boards give written notice. They do not threaten to cut power the same night by SMS."},
      {"flag": "Unknown officer contact", "evidence": "Please contact our electricity officer", "explanation": "Scammers ask you to call them so they can make you install an app or pay a fake bill."}
    ]'::jsonb,
    'Possibly a fake electricity disconnection message.',
    'This message tries to scare you about losing electricity tonight. Real electricity boards do not send such threats from personal numbers. Do not call any number in this message. Check your bill on the official BESCOM app or website.',
    '["Do not call the number in the message.", "Do not install any app they ask you to.", "Check your bill status on the official electricity board app or website.", "Block the sender."]'::jsonb,
    '["The message does not contain a link."]'::jsonb,
    'en',
    now() - interval '5 days'
  ),
  (
    'bbbbbbb1-0000-4000-8000-000000000004',
    '33333333-3333-4333-8333-333333333333',
    'text',
    'Hello! We are hiring for part-time work from home. Like YouTube videos and earn Rs 3000 daily. First task free, then deposit Rs 1000 to unlock VIP tasks. Join Telegram: t.me/earn_daily_xyz',
    'scam', 92, 'job_task',
    '[
      {"flag": "बहुत आसान कमाई", "evidence": "Like YouTube videos and earn Rs 3000 daily", "explanation": "वीडियो लाइक करने के लिए कोई भी कंपनी रोज़ 3000 रुपये नहीं देती।"},
      {"flag": "पहले पैसे जमा करना", "evidence": "deposit Rs 1000 to unlock VIP tasks", "explanation": "असली नौकरी में आपसे कभी पैसे नहीं माँगे जाते।"},
      {"flag": "Telegram पर बुलाना", "evidence": "Join Telegram: t.me/earn_daily_xyz", "explanation": "ठग Telegram ग्रुप में ले जाकर धीरे-धीरे और पैसे माँगते हैं।"}
    ]'::jsonb,
    'यह पार्ट-टाइम टास्क जॉब का धोखा है।',
    'यह संदेश आसान कमाई का लालच देता है। शुरू में थोड़े पैसे देकर भरोसा जीता जाता है। फिर बड़े पैसे जमा करवाकर ठग गायब हो जाते हैं। इस पर भरोसा न करें।',
    '["कोई पैसा जमा न करें।", "Telegram ग्रुप में शामिल न हों।", "भेजने वाले को ब्लॉक और रिपोर्ट करें।", "पैसे गए हों तो तुरंत 1930 पर कॉल करें।", "cybercrime.gov.in पर शिकायत करें।"]'::jsonb,
    '[]'::jsonb,
    'hi',
    now() - interval '2 days'
  ),
  (
    'bbbbbbb1-0000-4000-8000-000000000005',
    '33333333-3333-4333-8333-333333333333',
    'text',
    'Your order #4521 from the college canteen app is ready for pickup at counter 2.',
    'safe', 8, 'none',
    '[]'::jsonb,
    'यह सामान्य ऑर्डर अपडेट लगता है, फिर भी आधिकारिक ऐप पर जाँच लें।',
    'इस संदेश में कोई लिंक, पैसे की माँग या धमकी नहीं है। यह सिर्फ़ ऑर्डर तैयार होने की सूचना है। फिर भी, कोई भी कदम उठाने से पहले आधिकारिक ऐप में जाँच लें।',
    '["आधिकारिक ऐप में अपना ऑर्डर देखकर पुष्टि करें।"]'::jsonb,
    '["कोई लिंक नहीं है।", "कोई पैसा या OTP नहीं माँगा गया।", "कोई धमकी या जल्दबाज़ी नहीं है।"]'::jsonb,
    'hi',
    now() - interval '4 days'
  ),
  (
    'bbbbbbb1-0000-4000-8000-000000000006',
    '22222222-2222-4222-8222-222222222222',
    'image',
    'PhonePe: Collect request of Rs 4,999 from cashback.reward@ybl. Enter UPI PIN to receive your cashback.',
    'scam', 90, 'upi_payment_request',
    '[
      {"flag": "Collect request disguised as cashback", "evidence": "Enter UPI PIN to receive your cashback", "explanation": "You never need to enter your UPI PIN to receive money. Entering the PIN sends money out."}
    ]'::jsonb,
    'Fake cashback UPI collect request that will take money from you.',
    'This is a UPI collect request, not a payment to you. If you enter your PIN, Rs 4,999 will leave your account. Receiving money never needs a PIN.',
    '["Decline the collect request.", "Never enter your UPI PIN to receive money.", "Report the UPI ID in your payment app.", "Call 1930 if money was debited."]'::jsonb,
    '[]'::jsonb,
    'en',
    now() - interval '10 days'
  )
on conflict do nothing;

insert into public.alerts (id, guardian_id, user_id, scan_id, is_read, created_at) values
  ('ccccccc1-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'bbbbbbb1-0000-4000-8000-000000000001', false, now() - interval '1 day'),
  ('ccccccc1-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'bbbbbbb1-0000-4000-8000-000000000002', true,  now() - interval '3 days')
on conflict do nothing;
