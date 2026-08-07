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
  ('site.brand', 'site', 'Brand name', 'text', 'Tremezzo', 1),
  ('nav.home', 'nav', 'Home nav label', 'text', 'Home', 10),
  ('nav.gallery', 'nav', 'Gallery nav label', 'text', 'Gallery', 20),
  ('nav.rates', 'nav', 'Rates nav label', 'text', 'Rates', 30),
  ('nav.contact', 'nav', 'Contact nav label', 'text', 'Contact', 40),
  ('nav.book', 'nav', 'Book button label', 'text', 'Book', 50),
  ('footer.brand', 'footer', 'Footer brand', 'text', 'Tremezzo Plett', 10),
  ('footer.backToTop', 'footer', 'Back to top link', 'text', 'Back to top', 20),
  ('home.hero.eyebrow', 'home', 'Hero eyebrow', 'text', 'Welcome to', 1),
  ('home.hero.title', 'home', 'Hero title', 'text', 'Tremezzo', 2),
  ('home.hero.place', 'home', 'Hero place', 'text', 'Plettenberg Bay', 3),
  ('home.hero.button', 'home', 'Hero button', 'text', 'Rates & bookings', 4),
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
  ('home.photo.1.caption', 'home', 'Pool photo caption', 'textarea', 'Enjoy a splash in the private pool after a hot day at the beach.', 75),
  ('home.photo.2.caption', 'home', 'Bathroom photo caption', 'textarea', 'Fresh en-suite bathrooms with patterned tile, generous vanities and views toward the sea.', 76),
  ('home.location.heading', 'home', 'Location heading', 'text', 'Situated on the most desired stretch of Central Beach', 80),
  ('home.location.body', 'home', 'Location body', 'textarea', 'Tremezzo Plett offers unrivalled access to Central Beach, with sweeping views of the Indian Ocean and Outeniqua Mountains. Walk out the door and onto the sand, then explore coastal paths, nature, restaurants and the best of Plettenberg Bay from your doorstep.', 90),
  ('home.location.button.photos', 'home', 'Location photos button', 'text', 'View more photos', 91),
  ('home.location.button.reserve', 'home', 'Location reservation button', 'text', 'Make a reservation', 92),
  ('home.location.button.instagram', 'home', 'Location Instagram button', 'text', 'Follow on Instagram', 93),
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
  ('rates.hero.eyebrow', 'rates', 'Rates hero eyebrow', 'text', 'Tremezzo', 311),
  ('rates.hero.title', 'rates', 'Rates hero title', 'text', 'Rates & bookings', 312),
  ('rates.hero.place', 'rates', 'Rates hero place', 'text', 'Plettenberg Bay', 313),
  ('rates.booking.kicker', 'rates', 'Booking panel kicker', 'text', 'Ready to make Tremezzo yours?', 320),
  ('rates.booking.heading', 'rates', 'Booking panel heading', 'text', 'We would love to host you.', 330),
  ('rates.booking.body', 'rates', 'Booking panel body', 'textarea', 'Please reach out via WhatsApp or email to enquire about available dates and make a booking. The home accommodates up to 10 guests across five en-suite bedrooms, with direct beach access, sea views, two kitchens, spacious living areas and backup power.', 340),
  ('rates.availability.heading', 'rates', 'Availability heading', 'text', 'Availability', 345),
  ('rates.legend.available', 'rates', 'Calendar available label', 'text', 'Available', 346),
  ('rates.legend.selected', 'rates', 'Calendar selected label', 'text', 'Selected', 347),
  ('rates.legend.unavailable', 'rates', 'Calendar unavailable label', 'text', 'Unavailable', 348),
  ('rates.low.season', 'ratesCards', 'Low season label', 'text', 'Low season', 360),
  ('rates.low.title', 'ratesCards', 'Low season title', 'text', 'Autumn / winter', 370),
  ('rates.low.dates', 'ratesCards', 'Low season dates', 'textarea', '1 May to 7 September', 380),
  ('rates.low.price', 'ratesCards', 'Low season price', 'text', 'R7 500', 390),
  ('rates.low.unit', 'ratesCards', 'Low season unit', 'text', 'per night*', 400),
  ('rates.mid.season', 'ratesCards', 'Mid season label', 'text', 'Mid season', 410),
  ('rates.mid.title', 'ratesCards', 'Mid season title', 'text', 'Spring / summer', 420),
  ('rates.mid.dates', 'ratesCards', 'Mid season dates', 'textarea', '8 September to 7 December
8 January to 31 April', 430),
  ('rates.mid.price', 'ratesCards', 'Mid season price', 'text', 'R14 000', 440),
  ('rates.mid.unit', 'ratesCards', 'Mid season unit', 'text', 'per night*', 450),
  ('rates.peak.season', 'ratesCards', 'Peak season label', 'text', 'Peak season', 460),
  ('rates.peak.title', 'ratesCards', 'Peak season title', 'text', 'Summer', 470),
  ('rates.peak.dates', 'ratesCards', 'Peak season dates', 'textarea', '8 December to 7 January', 480),
  ('rates.peak.price', 'ratesCards', 'Peak season price', 'text', 'R22 500', 490),
  ('rates.peak.unit', 'ratesCards', 'Peak season unit', 'text', 'per night', 500),
  ('rates.note', 'ratesCards', 'Rates note', 'text', '*Rates can vary according to length of stay.', 510),
  ('rates.enquiry.heading', 'rates', 'Enquiry heading', 'text', 'Request your dates', 520),
  ('rates.enquiry.body', 'rates', 'Enquiry instructions', 'textarea', 'Select your preferred arrival and departure dates, then send your details. This is an enquiry, not an instant confirmed booking. The host will respond within 24 hours.', 530),
  ('booking.form.arrival', 'booking', 'Arrival field label', 'text', 'Arrival', 10),
  ('booking.form.departure', 'booking', 'Departure field label', 'text', 'Departure', 20),
  ('booking.form.name', 'booking', 'Name field label', 'text', 'Name', 30),
  ('booking.form.phone', 'booking', 'Phone field label', 'text', 'Phone', 40),
  ('booking.form.email', 'booking', 'Email field label', 'text', 'Email', 50),
  ('booking.form.guests', 'booking', 'Guests field label', 'text', 'Guests', 60),
  ('booking.form.message', 'booking', 'Message field label', 'text', 'Message', 70),
  ('booking.form.messagePlaceholder', 'booking', 'Message placeholder', 'textarea', 'Tell us anything useful about your stay.', 80),
  ('booking.form.submit', 'booking', 'Submit button', 'text', 'Send request', 90),
  ('gallery.hero.eyebrow', 'gallery', 'Gallery hero eyebrow', 'text', 'Tremezzo', 390),
  ('gallery.hero.title', 'gallery', 'Gallery hero title', 'text', 'Photo gallery', 391),
  ('gallery.hero.place', 'gallery', 'Gallery hero place', 'text', 'Plettenberg Bay', 392),
  ('gallery.heading', 'gallery', 'Gallery heading', 'text', 'Spaces for slow mornings, beach days and long summer evenings', 400),
  ('gallery.button.reserve', 'gallery', 'Gallery reservation button', 'text', 'Make a reservation', 405),
  ('gallery.caption.1', 'gallery', 'Gallery caption 1', 'text', 'Ocean-facing terrace', 410),
  ('gallery.caption.2', 'gallery', 'Gallery caption 2', 'text', 'Balcony views', 420),
  ('gallery.caption.3', 'gallery', 'Gallery caption 3', 'text', 'En-suite bedroom', 430),
  ('gallery.caption.4', 'gallery', 'Gallery caption 4', 'text', 'En-suite bathroom', 440),
  ('gallery.caption.5', 'gallery', 'Gallery caption 5', 'text', 'Direct beach access', 450),
  ('gallery.caption.6', 'gallery', 'Gallery caption 6', 'text', 'Private pool', 460),
  ('gallery.caption.7', 'gallery', 'Gallery caption 7', 'text', 'Comfortable bedrooms', 470),
  ('gallery.caption.8', 'gallery', 'Gallery caption 8', 'text', 'Bath and shower suites', 480),
  ('gallery.caption.9', 'gallery', 'Gallery caption 9', 'text', 'Evening atmosphere', 490),
  ('gallery.caption.10', 'gallery', 'Gallery caption 10', 'text', 'Flexible sleeping layouts', 500),
  ('contact.heading', 'contact', 'Contact heading', 'text', 'Is Tremezzo Plett calling your name?', 500),
  ('contact.subheading', 'contact', 'Contact subheading', 'text', 'We would love to host you.', 510),
  ('contact.body', 'contact', 'Contact body', 'textarea', 'Please reach out via WhatsApp or email to enquire about available dates, rates and bookings.', 520),
  ('contact.card.heading', 'contact', 'Contact card heading', 'text', 'Contact us', 530),
  ('contact.address', 'contact', 'Address', 'textarea', '5 Bull Street, Plettenberg Bay, Western Cape, South Africa', 540),
  ('contact.phone', 'contact', 'Phone number', 'text', '+27 84 206 4504', 550),
  ('contact.people', 'contact', 'Contact people', 'text', 'Amy, SA · Lauren, UAE', 560),
  ('contact.email', 'contact', 'Email address', 'text', 'bookings@tremezzoplett.co.za', 570),
  ('contact.social.heading', 'contact', 'Social heading', 'text', 'Let''s get social', 580),
  ('contact.social.button', 'contact', 'Homepage social button', 'text', 'Tag us in your photo', 590),
  ('contact.social.galleryButton', 'contact', 'Gallery social button', 'text', 'Tag us in your photos', 600)
on conflict (key) do nothing;
