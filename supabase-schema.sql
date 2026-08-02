create extension if not exists pgcrypto;

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default now(),
  constraint blocked_dates_valid_range check (start_date <= end_date)
);

create index if not exists blocked_dates_range_idx
  on public.blocked_dates (start_date, end_date);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  arrival_date date not null,
  departure_date date not null,
  name text not null,
  phone text not null,
  email text not null,
  guests integer not null,
  message text,
  status text not null default 'new',
  source text not null default 'website',
  user_agent text,
  created_at timestamptz not null default now(),
  constraint booking_requests_valid_range check (arrival_date <= departure_date),
  constraint booking_requests_valid_guests check (guests between 1 and 10)
);

alter table public.blocked_dates enable row level security;
alter table public.booking_requests enable row level security;

create index if not exists booking_requests_arrival_date_idx on public.booking_requests (arrival_date);
create index if not exists booking_requests_created_at_idx on public.booking_requests (created_at desc);

create table if not exists public.content_blocks (
  key text primary key,
  page text not null,
  label text not null,
  kind text not null default 'textarea' check (kind in ('text', 'textarea', 'list')),
  value text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists content_blocks_page_sort_idx on public.content_blocks (page, sort_order);

alter table public.content_blocks enable row level security;

grant select, insert, update, delete on public.blocked_dates to service_role;
grant select, insert, update, delete on public.booking_requests to service_role;
grant select, insert, update, delete on public.content_blocks to service_role;

insert into public.content_blocks (key, page, label, kind, value, sort_order) values
  ('home.intro.kicker', 'home', 'Intro kicker', 'text', 'Garden Route coastal living', 10),
  ('home.intro.heading', 'home', 'Intro heading', 'text', 'Your seaside escape in Plettenberg Bay', 20),
  ('home.intro.body', 'home', 'Intro body', 'textarea', 'Welcome to Tremezzo Villa, a spacious beachfront home in the heart of Central Beach. This recently renovated 735mÂ² retreat offers direct beach access, sweeping sea views, generous living areas and refined comfort for relaxed family holidays.', 30),
  ('home.rest.heading', 'home', 'Rest section heading', 'text', 'A home designed for rest, beauty & togetherness', 40),
  ('home.rest.body', 'home', 'Rest section body', 'textarea', 'Tremezzo sleeps up to 10 guests across five stylish en-suite bedrooms, with king-size beds or twin singles. The home includes two fully equipped kitchens, open-plan living and dining spaces, indoor and outdoor fireplaces, a games room, Wi-Fi, DSTV, gas braai and backup inverter power.', 50),
  ('home.amenities.kicker', 'home', 'Amenities heading', 'text', 'At Tremezzo Plett, you can enjoy', 60),
  ('home.amenities.list', 'home', 'Amenities list', 'list', 'Direct beach access to a beautiful cove
Five en-suite bedrooms with king-size beds or twin singles
Sea-facing main bedroom with enclosed glass patio
Two fully equipped kitchens, full laundry facilities and thoughtful starter kits
Generous open-plan living and dining areas with indoor and outdoor fireplaces
Rooftop deck and beach-facing outdoor deck
Swimming pool with a view, sun terrace, picnic spots and games room
Wi-Fi, DSTV, gas braai and inverter battery back-up power
A fully secured property
A staff-accommodation suite for a nanny or chef', 70),
  ('home.location.heading', 'home', 'Location heading', 'text', 'Situated on the most desired stretch of Central Beach', 80),
  ('home.location.body', 'home', 'Location body', 'textarea', 'Tremezzo Plett offers unrivalled access to Central Beach, with sweeping views of the Indian Ocean and Outeniqua Mountains. Walk out the door and onto the sand, then explore coastal paths, nature, restaurants and the best of Plettenberg Bay from your doorstep.', 90),
  ('home.reviews.heading', 'home', 'Reviews heading', 'text', 'What Booking.com guests say', 100),
  ('home.review.1.text', 'home', 'Review 1 text', 'textarea', 'Loved the superb position close to the beach, restaurants and shops, with the space and amenities needed for a great holiday.', 110),
  ('home.review.1.cite', 'home', 'Review 1 guest and country', 'text', 'Monika, Switzerland', 120),
  ('home.review.2.text', 'home', 'Review 2 text', 'textarea', 'Had a wonderful stay and found the managing agents helpful, attentive and easy to deal with.', 130),
  ('home.review.2.cite', 'home', 'Review 2 guest and country', 'text', 'Bruce, South Africa', 140),
  ('home.review.3.text', 'home', 'Review 3 text', 'textarea', 'Described the home as beautiful, thoughtfully prepared and perfectly located for a family holiday.', 150),
  ('home.review.3.cite', 'home', 'Review 3 guest and country', 'text', 'Tamlyn, Switzerland', 160),
  ('home.review.4.text', 'home', 'Review 4 text', 'textarea', 'Appreciated the large rooms, multiple sitting areas, well-stocked kitchen and family-friendly facilities.', 170),
  ('home.review.4.cite', 'home', 'Review 4 guest and country', 'text', 'Marguerite, Canada', 180),
  ('home.review.5.text', 'home', 'Review 5 text', 'textarea', 'Highlighted the direct position on Wedge Beach, private beach path, secure parking and helpful hosts.', 190),
  ('home.review.5.cite', 'home', 'Review 5 guest and country', 'text', 'Simon, South Africa', 200),
  ('rates.intro.heading', 'rates', 'Rates intro heading', 'text', 'Our rates per season', 300),
  ('rates.intro.body', 'rates', 'Rates intro body', 'textarea', 'The price may vary according to length of stay. Tremezzo Villa is a non-smoking property, quiet hours run from 22:00 to 07:00, and pets are welcome on request.', 310),
  ('rates.booking.kicker', 'rates', 'Booking panel kicker', 'text', 'Ready to make Tremezzo yours?', 320),
  ('rates.booking.heading', 'rates', 'Booking panel heading', 'text', 'We would love to host you.', 330),
  ('rates.booking.body', 'rates', 'Booking panel body', 'textarea', 'Please reach out via WhatsApp or email to enquire about available dates and make a booking. The home accommodates up to 10 guests across five en-suite bedrooms, with direct beach access, sea views, two kitchens, spacious living areas and backup power.', 340),
  ('rates.enquiry.body', 'rates', 'Enquiry instructions', 'textarea', 'Select your preferred arrival and departure dates, then send your details. This is an enquiry, not an instant confirmed booking. The host will respond within 24 hours.', 350),
  ('gallery.heading', 'gallery', 'Gallery heading', 'text', 'Spaces for slow mornings, beach days and long summer evenings', 400),
  ('contact.heading', 'contact', 'Contact heading', 'text', 'Is Tremezzo Plett calling your name?', 500),
  ('contact.subheading', 'contact', 'Contact subheading', 'text', 'We would love to host you.', 510),
  ('contact.body', 'contact', 'Contact body', 'textarea', 'Please reach out via WhatsApp or email to enquire about available dates, rates and bookings.', 520)
on conflict (key) do nothing;
