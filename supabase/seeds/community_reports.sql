-- ScamShield demo data: community scam reports (fictional identifiers only).
-- Safe to run more than once: rows have fixed ids and conflicts are skipped.
-- ---------------------------------------------------------------------------
-- Community scam reports (fictional demo identifiers only)
--   +910000000001  digital arrest caller        94 reports (42 this week)
--   +910000000002  electricity / KYC caller     52 reports (21 this week)
--   +910000000003  part-time job recruiter      18 reports (6 this week)
--   +910000000004  instant loan app agent       11 reports (3 this week)
--   kyc.refund.demo@oksbi   fake KYC refund UPI  84 reports (36 this week)
--   sbi-kyc-update.example  fake SBI KYC site   173 reports (78 this week)
--   parcel-customs-fee.example  courier fee     37 reports (12 this week)
-- Recent reports are spread over the last ~6 days, older ones before that.
-- ---------------------------------------------------------------------------
with demo (tag, identifier_type, identifier_value, total, recent, types) as (
  values
    ('p1', 'phone', '0000000001',                  94, 42, array['digital_arrest', 'delivery_courier']),
    ('p2', 'phone', '0000000002',                  52, 21, array['electricity_bill', 'kyc_bank']),
    ('p3', 'phone', '0000000003',                  18,  6, array['job_task']),
    ('p4', 'phone', '0000000004',                  11,  3, array['loan_app']),
    ('u1', 'upi',   'kyc.refund.demo@oksbi',       84, 36, array['kyc_bank', 'upi_payment_request']),
    ('w1', 'url',   'sbi-kyc-update.example',     173, 78, array['kyc_bank', 'phishing_link']),
    ('w2', 'url',   'parcel-customs-fee.example',  37, 12, array['delivery_courier'])
)
insert into public.scam_reports (id, reporter_id, identifier_type, identifier_value, scam_type, created_at)
select
  md5('scamshield-demo-report:' || d.tag || ':' || g.n)::uuid,
  null,
  d.identifier_type,
  d.identifier_value,
  -- first type is the most common; every third report uses the second type
  d.types[case when g.n % 3 = 0 and array_length(d.types, 1) > 1 then 2 else 1 end],
  case
    when g.n <= d.recent then now() - (g.n * (144.0 / d.recent)) * interval '1 hour'
    else now() - interval '8 days' - (g.n - d.recent) * interval '9 hours'
  end
from demo d
cross join lateral generate_series(1, d.total) as g(n)
on conflict do nothing;
