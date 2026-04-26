# Launch Checklist

## External-use counseling content checklist

Use this checklist before any consultation story is reused outside the private counseling flow.

1. Confirm `content_usage_agreed = true`.
2. Confirm `anonymized_content` is filled in by an admin.
3. Confirm `is_external_use_ready = true`.
4. Never publish the raw `body` field outside the private counseling area.
5. Remove or rewrite all identifying details before publishing:
   - names
   - phone numbers
   - email addresses
   - school names
   - company names
   - exact addresses
   - rare job titles or unique events that can identify the author
6. Do a second review before publication.
7. If there is any doubt about re-identification risk, do not publish the case.

## Pre-launch technical checklist

1. Apply every migration in `supabase/migrations`.
2. Verify admin-only pages still reject non-admin users.
3. Verify upload buckets use the intended public/private setting.
4. Verify Kakao JavaScript domain and product link domains are registered.
5. Verify rate-limit RPC works in production after migrations are applied.
