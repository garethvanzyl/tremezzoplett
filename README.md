# Tremezzo Plett

Static website for Tremezzo Plett in Plettenberg Bay.

## Local preview

```powershell
python -m http.server 8123 --directory .
```

Open `http://127.0.0.1:8123/`.

## Deploy

This folder can be deployed directly to Vercel as a static site. No build command is required.

## Booking calendar setup

Create a Supabase project, open the SQL editor, and run `supabase-schema.sql`.

Add these environment variables to the Vercel project:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
BOOKING_EMAIL_TO=lauren@foxstreetcomms.co.za
BOOKING_EMAIL_FROM=Tremezzo Plett <bookings@your-verified-domain.com>
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
ADMIN_PASSWORD=
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `ADMIN_PASSWORD` are secrets. Do not expose them in frontend code.
- `BOOKING_EMAIL_FROM` must use a domain verified in Resend. For testing, Resend's sandbox sender can be used, but production should use a verified domain.
- The admin page is `/admin.html`. It uses `ADMIN_PASSWORD` to add or remove blocked date ranges.
- The public calendar reads blocked dates from Supabase through `/api/availability`.
- The booking form posts to `/api/booking-request`, validates Cloudflare Turnstile server-side when configured, stores the enquiry in Supabase, and emails the host.
