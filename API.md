# ScamShield API

> Check before you click, pay or panic.

Base URL (local): `http://localhost:5000/api`

- All requests and responses are JSON, except `POST /api/scans`, which is `multipart/form-data`.
- Protected routes need the header `Authorization: Bearer <token>`. Tokens are valid for 7 days.
- Languages: `en` (English), `hi` (Hindi), `kn` (Kannada).
- `user` object (password hashes are never returned):

```json
{ "id": "uuid", "name": "Asha Rao", "email": "asha@example.com", "preferred_language": "kn" }
```

## Errors

Every error has the same shape:

```json
{ "error": { "message": "Human readable message", "code": "MACHINE_CODE" } }
```

Validation errors also include `details: [{ "field", "message" }]`.

| Status | When | Example codes |
|---|---|---|
| 400 | Invalid input | `VALIDATION_ERROR`, `INVALID_JSON`, `NO_INPUT`, `INVALID_FILE_TYPE`, `CANNOT_INVITE_SELF` |
| 401 | Missing/invalid/expired token, wrong password | `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS` |
| 403 | Not allowed | `NOT_INVITED_GUARDIAN`, `CORS_NOT_ALLOWED` |
| 404 | Not found (or not yours) | `SCAN_NOT_FOUND`, `USER_NOT_FOUND`, `INVITE_NOT_FOUND`, `ALERT_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409 | Duplicate | `EMAIL_TAKEN`, `ALREADY_INVITED`, `ALREADY_ACCEPTED` |
| 413 | Image over 8 MB / body too large | `FILE_TOO_LARGE`, `PAYLOAD_TOO_LARGE` |
| 422 | Image is not a readable message, or the AI could not analyse it | `UNREADABLE_IMAGE`, `AI_NO_RESULT` |
| 429 | Rate limit hit | `RATE_LIMITED`, `AI_RATE_LIMITED` |
| 500 | Unexpected server error | `INTERNAL_ERROR`, `DATABASE_ERROR` |
| 503 | AI service not configured or temporarily down | `AI_NOT_CONFIGURED`, `AI_UNAVAILABLE`, `AI_BAD_RESPONSE` |

## Rate limits

| Scope | Limit |
|---|---|
| All `/api` routes | 300 requests / 15 min per IP |
| `POST /api/auth/signup`, `POST /api/auth/login` | 20 requests / 15 min per IP |
| `POST /api/scans` | 20 scans / 10 min per user |
| `POST /api/scans/:id/explain` | 30 requests / 10 min per user |

Responses carry the standard `RateLimit` and `RateLimit-Policy` headers.

## Scan fields

| Field | Values |
|---|---|
| `risk_level` | `safe` (score 0–30), `suspicious` (31–69), `scam` (70–100) |
| `risk_score` | integer 0–100 (higher = more dangerous) |
| `scam_type` | `kyc_bank`, `job_task`, `digital_arrest`, `lottery_prize`, `investment_trading`, `upi_payment_request`, `delivery_courier`, `loan_app`, `electricity_bill`, `impersonation`, `phishing_link`, `sextortion`, `other`, `none` (only for safe) |
| `red_flags` | `[{ flag, evidence, explanation }]`. `evidence` is an exact quote from the message, so the UI can highlight it inside `message_text`. |
| `message_text` | The message as stored: every run of 6+ digits is masked to its last 4 digits (`XXXXXX1234`), max 2000 characters. Images are never stored. |

---

## Health

### `GET /api/health`

```bash
curl http://localhost:5000/api/health
```

`200`
```json
{ "status": "ok" }
```

---

## Auth

### `POST /api/auth/signup`

Body: `name` (1–100 chars), `email`, `password` (6–72 chars), `preferred_language` (optional, default `en`).

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Meena Iyer","email":"meena@example.com","password":"secret123","preferred_language":"hi"}'
```

`201`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "5b0c8a3e-6c1e-4f43-9a55-2f1f6f3c9b10", "name": "Meena Iyer", "email": "meena@example.com", "preferred_language": "hi" }
}
```

`409` if the email is already registered:
```json
{ "error": { "message": "An account with this email already exists", "code": "EMAIL_TAKEN" } }
```

### `POST /api/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"Demo@1234"}'
```

`200`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "11111111-1111-4111-8111-111111111111", "name": "Asha Rao", "email": "asha@example.com", "preferred_language": "kn" }
}
```

`401`
```json
{ "error": { "message": "Incorrect email or password", "code": "INVALID_CREDENTIALS" } }
```

### `GET /api/auth/me`  (protected)

```bash
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{ "user": { "id": "11111111-1111-4111-8111-111111111111", "name": "Asha Rao", "email": "asha@example.com", "preferred_language": "kn" } }
```

---

## Users

### `PATCH /api/users/me`  (protected)

```bash
curl -X PATCH http://localhost:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"preferred_language":"en"}'
```

`200`
```json
{ "user": { "id": "11111111-1111-4111-8111-111111111111", "name": "Asha Rao", "email": "asha@example.com", "preferred_language": "en" } }
```

---

## Scans

### `POST /api/scans`  (protected, multipart/form-data)

Fields:
- `image`: optional file, JPEG/PNG/WEBP, max 8 MB.
- `text`: optional string, max 5000 characters.
- `language`: optional `en` | `hi` | `kn` (defaults to the user's `preferred_language`).

At least one of `image` or `text` is required. If `risk_level` is `scam`, every **accepted** guardian of the user gets an alert.

```bash
# Paste text
curl -X POST http://localhost:5000/api/scans \
  -H "Authorization: Bearer $TOKEN" \
  -F "text=Dear Customer, your SBI account will be BLOCKED today. Update KYC at http://sbi-kyc-update.in. OTP 482913" \
  -F "language=en"

# Upload a screenshot
curl -X POST http://localhost:5000/api/scans \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@screenshot.png" -F "language=hi"
```

`201`
```json
{
  "scan": {
    "id": "0f7e1c52-9d4b-4f3a-8a3e-1b2c3d4e5f60",
    "input_type": "text",
    "message_text": "Dear Customer, your SBI account will be BLOCKED today. Update KYC at http://sbi-kyc-update.in. OTP XX2913",
    "risk_level": "scam",
    "risk_score": 95,
    "scam_type": "kyc_bank",
    "red_flags": [
      { "flag": "Threat of account block", "evidence": "will be BLOCKED today", "explanation": "Banks never block your account by SMS. This is meant to scare you." },
      { "flag": "Fake website link", "evidence": "http://sbi-kyc-update.in", "explanation": "This is not SBI's official website." }
    ],
    "summary": "This is a fake bank KYC message meant to steal your account details.",
    "explanation": "This message pretends to be from SBI. It scares you by saying your account will be blocked. The link opens a fake website. If you enter your details there, scammers can take your money.",
    "actions": [
      "Do not click the link.",
      "Never share your OTP, PIN or password with anyone.",
      "Block and report the sender.",
      "If you lost money, call 1930 immediately.",
      "Report it at cybercrime.gov.in.",
      "Check your account only on the official YONO SBI app."
    ],
    "safe_reasons": [],
    "language": "en",
    "created_at": "2026-11-14T06:30:00.000Z"
  }
}
```

`400` (nothing sent):
```json
{ "error": { "message": "Upload a screenshot or paste the message text", "code": "NO_INPUT" } }
```

`422` (the image is not a message or can't be read; the message is in the chosen language):
```json
{ "error": { "message": "We could not read a message in this image. Please upload a clear screenshot of the message or paste the text instead.", "code": "UNREADABLE_IMAGE" } }
```

`413`:
```json
{ "error": { "message": "Image is too large. The maximum size is 8 MB.", "code": "FILE_TOO_LARGE" } }
```

### `GET /api/scans`  (protected)

Newest first. Optional query: `limit` (1–100, default 50), `offset` (default 0).

```bash
curl "http://localhost:5000/api/scans?limit=20" -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{
  "scans": [
    { "id": "bbbbbbb1-0000-4000-8000-000000000001", "summary": "This is a fake bank KYC message meant to steal your account details.", "risk_level": "scam", "risk_score": 94, "scam_type": "kyc_bank", "created_at": "2026-11-13T06:30:00.000Z" },
    { "id": "bbbbbbb1-0000-4000-8000-000000000003", "summary": "Possibly a fake electricity disconnection message.", "risk_level": "suspicious", "risk_score": 64, "scam_type": "electricity_bill", "created_at": "2026-11-09T06:30:00.000Z" }
  ]
}
```

### `GET /api/scans/:id`  (protected)

```bash
curl http://localhost:5000/api/scans/bbbbbbb1-0000-4000-8000-000000000001 -H "Authorization: Bearer $TOKEN"
```

`200`: `{ "scan": { ...same fields as POST /api/scans... } }`

`404` if the scan doesn't exist or belongs to someone else:
```json
{ "error": { "message": "Scan not found", "code": "SCAN_NOT_FOUND" } }
```

### `POST /api/scans/:id/explain`  (protected)

Re-explains an existing scan in another language. The verdict (level, score, type) is unchanged, `evidence` quotes stay exact, and no new scan is created.

```bash
curl -X POST http://localhost:5000/api/scans/bbbbbbb1-0000-4000-8000-000000000001/explain \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"language":"kn"}'
```

`200`
```json
{
  "explanation": "ಈ ಸಂದೇಶ SBI ಬ್ಯಾಂಕ್‌ನಿಂದ ಬಂದಂತೆ ನಟಿಸುತ್ತಿದೆ. ನಿಮ್ಮ ಖಾತೆ ಬ್ಲಾಕ್ ಆಗುತ್ತದೆ ಎಂದು ಹೆದರಿಸುತ್ತಿದೆ. ಲಿಂಕ್ ನಕಲಿ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಹೋಗುತ್ತದೆ.",
  "summary": "ಇದು ನಿಮ್ಮ ಖಾತೆ ವಿವರ ಕದಿಯಲು ಕಳುಹಿಸಿದ ನಕಲಿ KYC ಸಂದೇಶ.",
  "red_flags": [
    { "flag": "ಖಾತೆ ಬ್ಲಾಕ್ ಬೆದರಿಕೆ", "evidence": "will be BLOCKED today", "explanation": "ಬ್ಯಾಂಕ್ SMS ಮೂಲಕ ಖಾತೆ ಬ್ಲಾಕ್ ಮಾಡುವುದಿಲ್ಲ." }
  ],
  "actions": ["ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ.", "ನಿಮ್ಮ OTP ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.", "ಹಣ ಕಳೆದುಕೊಂಡಿದ್ದರೆ 1930 ಗೆ ಕರೆ ಮಾಡಿ."]
}
```

### `DELETE /api/scans/:id`  (protected)

Deletes the scan and any guardian alerts created for it.

```bash
curl -X DELETE http://localhost:5000/api/scans/bbbbbbb1-0000-4000-8000-000000000003 -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{ "success": true }
```

---

## Guardians

A guardian is a family member who gets an alert whenever the person they protect scans a message rated `scam`.

### `POST /api/guardians/invite`  (protected)

The logged-in user asks an existing user to be their guardian.

```bash
curl -X POST http://localhost:5000/api/guardians/invite \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"ravi@example.com"}'
```

`201`
```json
{
  "invite": {
    "id": "7d1f2e3a-4b5c-4d6e-8f70-112233445566",
    "user_id": "5b0c8a3e-6c1e-4f43-9a55-2f1f6f3c9b10",
    "guardian_id": "22222222-2222-4222-8222-222222222222",
    "status": "pending",
    "created_at": "2026-11-14T06:30:00.000Z",
    "other_user": { "id": "22222222-2222-4222-8222-222222222222", "name": "Ravi Rao", "email": "ravi@example.com" }
  }
}
```

Errors: `404 USER_NOT_FOUND` (email not registered), `400 CANNOT_INVITE_SELF`, `409 ALREADY_INVITED`.

### `GET /api/guardians`  (protected)

- `my_guardians`: people who protect me (pending and accepted).
- `people_i_protect`: people I'm an accepted guardian for.
- `pending_invites_for_me`: invites waiting for me to accept.

```bash
curl http://localhost:5000/api/guardians -H "Authorization: Bearer $TOKEN"
```

`200` (logged in as Ravi)
```json
{
  "my_guardians": [],
  "people_i_protect": [
    { "id": "aaaaaaa1-0000-4000-8000-000000000001", "status": "accepted", "created_at": "2026-10-26T06:30:00.000Z", "other_user": { "id": "11111111-1111-4111-8111-111111111111", "name": "Asha Rao", "email": "asha@example.com" } }
  ],
  "pending_invites_for_me": [
    { "id": "aaaaaaa1-0000-4000-8000-000000000002", "status": "pending", "created_at": "2026-11-12T06:30:00.000Z", "other_user": { "id": "33333333-3333-4333-8333-333333333333", "name": "Priya Sharma", "email": "priya@example.com" } }
  ]
}
```

### `POST /api/guardians/:id/accept`  (protected)

Only the invited guardian can accept.

```bash
curl -X POST http://localhost:5000/api/guardians/aaaaaaa1-0000-4000-8000-000000000002/accept \
  -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{
  "guardian": {
    "id": "aaaaaaa1-0000-4000-8000-000000000002",
    "user_id": "33333333-3333-4333-8333-333333333333",
    "guardian_id": "22222222-2222-4222-8222-222222222222",
    "status": "accepted",
    "created_at": "2026-11-12T06:30:00.000Z"
  }
}
```

Errors: `403 NOT_INVITED_GUARDIAN` (the inviter tried to accept), `404 INVITE_NOT_FOUND`, `409 ALREADY_ACCEPTED`.

### `DELETE /api/guardians/:id`  (protected)

Either person in the link can remove it. The guardian's alerts about that person are removed too.

```bash
curl -X DELETE http://localhost:5000/api/guardians/aaaaaaa1-0000-4000-8000-000000000002 \
  -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{ "success": true }
```

---

## Alerts

### `GET /api/alerts`  (protected)

Alerts for the logged-in guardian, newest first (up to 100).

```bash
curl http://localhost:5000/api/alerts -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{
  "alerts": [
    {
      "id": "ccccccc1-0000-4000-8000-000000000001",
      "is_read": false,
      "created_at": "2026-11-13T06:30:00.000Z",
      "person": { "name": "Asha Rao" },
      "scan": { "id": "bbbbbbb1-0000-4000-8000-000000000001", "summary": "This is a fake bank KYC message meant to steal your account details.", "risk_score": 94, "scam_type": "kyc_bank" }
    }
  ],
  "unread_count": 1
}
```

### `PATCH /api/alerts/:id/read`  (protected)

```bash
curl -X PATCH http://localhost:5000/api/alerts/ccccccc1-0000-4000-8000-000000000001/read \
  -H "Authorization: Bearer $TOKEN"
```

`200`
```json
{ "success": true }
```

---

## Trends

### `GET /api/trends`  (public, no auth)

Anonymous counts only, with no personal data. `last_7_days` counts scans flagged with a scam type in the last 7 days.

```bash
curl http://localhost:5000/api/trends
```

`200`
```json
{
  "total_scans": 6,
  "scams_caught": 4,
  "last_7_days": [
    { "scam_type": "digital_arrest", "count": 1 },
    { "scam_type": "electricity_bill", "count": 1 },
    { "scam_type": "job_task", "count": 1 },
    { "scam_type": "kyc_bank", "count": 1 }
  ]
}
```
