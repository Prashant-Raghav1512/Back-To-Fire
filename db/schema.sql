-- Born to Fire — Neon Postgres schema + seed data
-- Run once against a fresh database:
--   psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS programs (
  id text PRIMARY KEY,
  title text NOT NULL,
  duration text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  description text NOT NULL,
  features text[] NOT NULL,
  icon text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  name text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  muscle_group text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  steps text[] NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  -- 'Membership' | 'Program' | 'Event' | 'Others'; purpose_detail is only
  -- ever populated when purpose is 'Others' (the form's free-text follow-up).
  purpose text NOT NULL DEFAULT 'Others',
  purpose_detail text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per newsletter signup (src/lib/newsletter.ts, the Footer's
-- "Stay Updated" form). `email` is UNIQUE so re-submitting the same address
-- is a harmless no-op (ON CONFLICT DO NOTHING) rather than a duplicate row
-- or a confusing error — signing up twice should just look like success.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per (user, program-or-event) enrollment. `clerk_user_id` is
-- Clerk's stable user id (see src/lib/enrollments.ts) — not a foreign key
-- to any table here, since users live in Clerk, not Neon. `item_title` and
-- `item_detail` are a snapshot of the program/event at enrollment time, so a
-- user's history still reads sensibly even if that program/event is later
-- edited or removed from src/data/*.
CREATE TABLE IF NOT EXISTS enrollments (
  id bigserial PRIMARY KEY,
  clerk_user_id text NOT NULL,
  user_email text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('program', 'event')),
  item_id text NOT NULL,
  item_title text NOT NULL,
  item_detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clerk_user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS enrollments_clerk_user_id_idx ON enrollments (clerk_user_id);

-- One row per user, holding both their Community tab state (see
-- src/lib/community.ts) and the optional personal details editable from
-- the Profile page's "Personal Details" section (age/height/weight/gender —
-- name and profile photo are deliberately NOT duplicated here, since Clerk
-- already owns those and has its own upload/edit UI). `clerk_user_id` is a
-- soft reference to Clerk, same as `enrollments` above — no FK, since users
-- live in Clerk, not Neon. Kept as its own small table (rather than Clerk
-- unsafeMetadata) so it follows the same "per-user data lives in Neon"
-- pattern the rest of the app already uses, instead of introducing a
-- second place user data can live.
CREATE TABLE IF NOT EXISTS community_profiles (
  clerk_user_id text PRIMARY KEY,
  display_name text NOT NULL,
  state text NOT NULL,
  age integer,
  height_cm integer,
  weight_kg numeric(5,2),
  gender text CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Community board chat messages. `display_name` and `state` are a snapshot
-- taken at post time (same reasoning as enrollments' item_title/item_detail
-- snapshot) — a message's shown state shouldn't retroactively change if the
-- poster later updates their community_profiles row, and the feed should
-- still read sensibly even if community_profiles is ever cleared.
--
-- `group_type`/`group_key` identify which room a message belongs to —
-- 'state'/<state name>, 'india'/'india', 'age'/<age group id>,
-- 'interest'/<interest id>, or 'event'/<event id> (see
-- src/lib/communityGroups.ts). Each room's messages are fully isolated
-- (WHERE group_type = ... AND group_key = ...) — notably 'india' is its own
-- real room with its own messages now, not just an unfiltered view over
-- every state's posts the way it worked before this column existed.
--
-- `image_url` is an optional base64 data URI (src/lib/imageUpload.ts) — same
-- "no backend to sign a real object-storage upload with" tradeoff as
-- community_posts' image_url below. Chat does NOT support video: it polls
-- every 7s (see useCommunityMessages), so any large inline media there
-- would be re-fetched by every open chat window every 7 seconds — fine for
-- a compressed <900KB photo, not fine for multi-MB video. Video is
-- deliberately posts-only (community_posts.video_url), which polls only
-- every 15s and is a browse-when-you-open-it feed, not a live one.
CREATE TABLE IF NOT EXISTS community_messages (
  id bigserial PRIMARY KEY,
  clerk_user_id text NOT NULL,
  display_name text NOT NULL,
  state text NOT NULL,
  group_type text NOT NULL DEFAULT 'state',
  group_key text NOT NULL DEFAULT '',
  message text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Backfills for databases created before group_type/group_key existed —
-- no-ops on a fresh database (the columns above already exist with these
-- defaults), but bring an existing database up to date. Every message that
-- predates this column was, in effect, a post to its author's own state
-- room (see the old, unfiltered 'india' behavior noted above), so that's
-- exactly what the backfill assigns.
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'state';
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS group_key text NOT NULL DEFAULT '';
UPDATE community_messages SET group_type = 'state', group_key = state WHERE group_key = '';
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS image_url text;

CREATE INDEX IF NOT EXISTS community_messages_group_idx ON community_messages (group_type, group_key, created_at DESC);

-- Community board posts — a separate, slower-paced feed from the live chat
-- above, supporting an optional image OR video (never both — the composer
-- enforces that, not a DB constraint). `display_name`/`state` snapshot the
-- same way community_messages does; `group_type`/`group_key` scope a post
-- to whichever room it was posted in, same model as community_messages.
--
-- Both are stored inline as base64 data URIs rather than in real object
-- storage (S3, Cloudinary, etc.) — this project has no backend to sign such
-- an upload with, and no third-party host credentials exist for it either,
-- so this reuses the same "ship it straight from the browser" tradeoff
-- already made for VITE_NEON_CONTACT_URL/VITE_GROQ_API_KEY (see CLAUDE.md,
-- "No backend, by design"). `image_url`: src/lib/imageUpload.ts downscales/
-- compresses every image client-side before it's ever sent, keeping rows
-- small (~900KB cap). `video_url`: no such compression is possible without
-- a real encoder (no ffmpeg.wasm etc. in this stack) — src/lib/
-- videoUpload.ts only enforces a hard ~8MB input cap, so a video row can be
-- meaningfully larger than an image row; that tradeoff (and why video isn't
-- also in community_messages) is discussed on that table above.
CREATE TABLE IF NOT EXISTS community_posts (
  id bigserial PRIMARY KEY,
  clerk_user_id text NOT NULL,
  display_name text NOT NULL,
  state text NOT NULL,
  group_type text NOT NULL,
  group_key text NOT NULL,
  body text NOT NULL,
  image_url text,
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill for databases created before video_url existed — no-op on a
-- fresh database (the column above already exists).
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS video_url text;

CREATE INDEX IF NOT EXISTS community_posts_group_idx ON community_posts (group_type, group_key, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_user_idx ON community_posts (clerk_user_id, created_at DESC);

-- Comments on a community_posts row. Deleting a post cascades to its
-- comments — there is no standalone reason to keep orphaned comments around
-- once their post is gone.
CREATE TABLE IF NOT EXISTS community_post_comments (
  id bigserial PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES community_posts (id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_post_comments_post_idx ON community_post_comments (post_id, created_at ASC);

-- One row per signed-in visitor, get-or-created the moment
-- src/lib/friendId.ts's getOrCreateFriendId is called for them — unlike
-- community_profiles (only created by saving Personal Details) or
-- memberships (only created by joining), this happens silently in the
-- background (see FriendIdBootstrap.tsx, mounted app-wide) so genuinely
-- every visitor has a Friend ID as soon as they load any page while signed
-- in, not just members or people who filled in a form. `friend_id` is a
-- GENERATED column derived from the row's own bigserial id, same pattern as
-- memberships.member_id, but with a distinct "BTF-U" prefix so the two id
-- schemes are never visually confused. `display_name` is refreshed on every
-- get-or-create call (ON CONFLICT DO UPDATE) rather than a one-time
-- snapshot, since creation isn't a deliberate user action the way joining a
-- membership is.
CREATE TABLE IF NOT EXISTS user_ids (
  id bigserial PRIMARY KEY,
  clerk_user_id text NOT NULL UNIQUE,
  friend_id text GENERATED ALWAYS AS ('BTF-U' || LPAD(id::text, 6, '0')) STORED,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per friend relationship, in every state it's ever been —
-- 'pending' (a request awaiting a response), 'accepted', or 'declined'.
-- `requester_*`/`recipient_*` snapshot display names the same way every
-- other Community table does; who is "requester" vs "recipient" can change
-- over time (see src/lib/friends.ts's sendFriendRequest — re-requesting
-- after a decline flips the row's direction rather than inserting a
-- second row for the same pair, and a request into someone who already
-- requested you gets auto-accepted instead of duplicated). The unique
-- index below is direction-independent (LEAST/GREATEST) specifically so
-- there can only ever be one row per pair of users, no matter who
-- requested whom first.
CREATE TABLE IF NOT EXISTS friend_requests (
  id bigserial PRIMARY KEY,
  requester_clerk_user_id text NOT NULL,
  requester_display_name text NOT NULL,
  recipient_clerk_user_id text NOT NULL,
  recipient_display_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_pair_idx
  ON friend_requests (LEAST(requester_clerk_user_id, recipient_clerk_user_id), GREATEST(requester_clerk_user_id, recipient_clerk_user_id));
CREATE INDEX IF NOT EXISTS friend_requests_recipient_idx ON friend_requests (recipient_clerk_user_id, status);
CREATE INDEX IF NOT EXISTS friend_requests_requester_idx ON friend_requests (requester_clerk_user_id, status);

-- Private 1:1 messages between two friends (src/lib/directMessages.ts).
-- Not tied to friend_requests by a foreign key — unfriending removes the
-- friendship row but deliberately leaves message history intact, same as
-- most real chat apps. `sender_display_name` is a snapshot; the
-- recipient's name is already known client-side from the friendship it was
-- opened from, so it isn't duplicated here.
CREATE TABLE IF NOT EXISTS direct_messages (
  id bigserial PRIMARY KEY,
  sender_clerk_user_id text NOT NULL,
  sender_display_name text NOT NULL,
  recipient_clerk_user_id text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS direct_messages_pair_idx
  ON direct_messages (LEAST(sender_clerk_user_id, recipient_clerk_user_id), GREATEST(sender_clerk_user_id, recipient_clerk_user_id), created_at);

-- Caches one article's translated title/content per (article, language)
-- pair the first time anyone requests it (see src/lib/articleTranslate.ts).
-- The Articles translator calls Google's free, keyless translate_a/single
-- endpoint directly from the browser — no API key to manage, but also no
-- guaranteed uptime/rate limit contract since it's unofficial, so caching
-- every result here means it only ever needs to succeed ONCE per article
-- per language, no matter how many visitors read that translation
-- afterward. This replaced an earlier Groq-based (LLM) translator that
-- proved unreliable in practice — see git history if that's ever revisited.
CREATE TABLE IF NOT EXISTS article_translations (
  article_id text NOT NULL,
  language_code text NOT NULL,
  title text NOT NULL,
  content text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, language_code)
);

-- Same cache-forever pattern as article_translations above, for the
-- exercise guide's translate option (ExerciseModal.tsx's "View full guide"
-- popup and ExerciseGuide.tsx's inline panel on /exercises — both call
-- src/lib/exerciseTranslate.ts). muscle_group/difficulty are never
-- translated (short fixed labels, not prose), so only name/description/
-- steps are cached here.
CREATE TABLE IF NOT EXISTS exercise_translations (
  exercise_id text NOT NULL,
  language_code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  steps text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (exercise_id, language_code)
);

-- One row per member — joining any of the three membership types
-- (src/data/membershipTypes.ts: normal/corporate/family) is what actually
-- grants someone a member_id; browsing the site or even having a
-- community_profiles row does not. `member_id` is a GENERATED column
-- derived from the row's own bigserial id (e.g. "BTF000042") rather than a
-- separately-issued value, so it's guaranteed unique with no extra
-- coordination. `company_name` only applies to `membership_type =
-- 'corporate'`; that's an application-level rule (src/lib/membership.ts),
-- not a CHECK constraint, same "guardrail not real enforcement" pattern
-- used throughout this backend-less app. `monthly_price` snapshots
-- membershipTypes.ts's price for the chosen type/billing_cycle *at join
-- time* in INR (null for `corporate`, which is custom/negotiated, not a
-- fixed fee) — same "snapshot, don't drift if the source data changes
-- later" reasoning as enrollments.item_detail. Despite the column's name
-- (kept as-is rather than renamed, to avoid an extra migration), it holds
-- whatever the chosen billing_cycle's price actually is — the discounted
-- yearly total when billing_cycle = 'yearly', not that figure divided by
-- 12; src/lib/membership.ts maps it to the TS field `price`, not
-- `monthlyPrice`, precisely because it isn't always a monthly figure.
-- `billing_cycle` is null only for `corporate` (custom/negotiated, no
-- fixed recurring cycle). `payment_method` is the visitor's stated
-- preference from `PaymentMethodSelector` — presentational only, same
-- "no real payment gateway wired up" caveat as `MembershipPlans.tsx`'s
-- (see `src/data/paymentMethods.ts`).
CREATE TABLE IF NOT EXISTS memberships (
  id bigserial PRIMARY KEY,
  clerk_user_id text NOT NULL UNIQUE,
  member_id text GENERATED ALWAYS AS ('BTF' || LPAD(id::text, 6, '0')) STORED,
  membership_type text NOT NULL CHECK (membership_type IN ('normal', 'corporate', 'family')),
  display_name text NOT NULL,
  company_name text,
  monthly_price integer,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Backfills for databases created before monthly_price/payment_method/
-- billing_cycle existed — no-ops on a fresh database (the columns above
-- already exist).
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS monthly_price integer;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Backfills for databases created before the contact form's purpose
-- dropdown/phone field existed — no-ops on a fresh database.
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'Others';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS purpose_detail text;

CREATE UNIQUE INDEX IF NOT EXISTS memberships_member_id_idx ON memberships (member_id);

-- Up to 4 dependents registered under one `family` membership
-- (src/lib/membership.ts enforces the cap in application code before
-- inserting — there's no DB-level count constraint). These are just
-- name/relation/age records, not linked site accounts: a family
-- membership's point is that a spouse or kid doesn't need their own login
-- to be covered by it.
CREATE TABLE IF NOT EXISTS family_members (
  id bigserial PRIMARY KEY,
  membership_id bigint NOT NULL REFERENCES memberships (id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text,
  age integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS family_members_membership_idx ON family_members (membership_id);

-- Programs -------------------------------------------------------------

INSERT INTO programs (id, title, duration, difficulty, description, features, icon, sort_order) VALUES
  (
    'beginner',
    'Foundation Starter',
    '4 Weeks',
    'Beginner',
    'Build a solid base with fundamental movements. Perfect for first-timers who want to build confidence, mobility, and basic strength from the comfort of home.',
    ARRAY[
      '3 sessions per week (20-30 min)',
      'Wall push-ups, assisted squats, glute bridges',
      'Mobility & warm-up routines',
      'Form coaching videos'
    ],
    'Sprout',
    1
  ),
  (
    'intermediate',
    'Strength Builder',
    '8 Weeks',
    'Intermediate',
    'Level up with full bodyweight movements. Develop real pushing, pulling, and core strength while improving control and endurance.',
    ARRAY[
      '4 sessions per week (30-45 min)',
      'Pull-ups, dips, pistol squat progressions',
      'Core & skill work',
      'Weekly progress tracking'
    ],
    'Flame',
    2
  ),
  (
    'advanced',
    'Calisthenics Mastery',
    '12 Weeks',
    'Advanced',
    'Master impressive skills and elite strength. Train toward the planche, front lever, muscle-up, and handstand push-up with structured progressions.',
    ARRAY[
      '5 sessions per week (45-60 min)',
      'Planche, front lever, muscle-up progressions',
      'Dynamic & explosive power work',
      'Personalised skill roadmap'
    ],
    'Zap',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Exercises --------------------------------------------------------------

INSERT INTO exercises (id, name, difficulty, muscle_group, description, image, steps, sort_order) VALUES
  (
    'push-ups', 'Push-ups', 'Beginner', 'Chest, Shoulders, Triceps',
    'The king of upper-body bodyweight moves. Builds pressing strength and shoulder stability with zero equipment.',
    'https://images.pexels.com/photos/6496124/pexels-photo-6496124.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Place hands shoulder-width apart on the floor',
      'Keep your body in a straight line from head to heels',
      'Lower your chest toward the floor by bending elbows',
      'Press back up powerfully to full extension'
    ], 1
  ),
  (
    'pull-ups', 'Pull-ups', 'Advanced', 'Back, Biceps, Forearms',
    'A true test of relative strength. Pull-ups build a strong back and grip using just a bar — find one at a park or doorway.',
    'https://images.pexels.com/photos/4803667/pexels-photo-4803667.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Hang from a bar with palms facing away',
      'Engage your back and pull shoulder blades down',
      'Pull your chin above the bar',
      'Lower with control to a full hang'
    ], 2
  ),
  (
    'squats', 'Squats', 'Beginner', 'Quads, Glutes, Hamstrings',
    'The foundational lower-body movement. Builds leg strength, hip mobility, and balance — the base for every advanced leg skill.',
    'https://images.pexels.com/photos/8173430/pexels-photo-8173430.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Stand with feet shoulder-width apart',
      'Push hips back and bend knees',
      'Keep chest tall and knees tracking over toes',
      'Drive through heels to stand back up'
    ], 3
  ),
  (
    'lunges', 'Lunges', 'Beginner', 'Quads, Glutes, Core',
    'Unilateral leg work that improves balance, coordination, and single-leg strength. Great for fixing strength imbalances.',
    'https://images.pexels.com/photos/8770407/pexels-photo-8770407.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Step forward with one leg',
      'Lower until both knees are at 90 degrees',
      'Keep your torso upright and core tight',
      'Push through the front heel to return'
    ], 4
  ),
  (
    'plank', 'Plank', 'Beginner', 'Core, Shoulders',
    'An isometric core exercise that builds total-body tension and stability. The foundation of all advanced calisthenics holds.',
    'https://images.pexels.com/photos/9376270/pexels-photo-9376270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Rest on forearms with elbows under shoulders',
      'Extend legs back, body in a straight line',
      'Brace your abs and squeeze glutes',
      'Hold steady, breathing normally'
    ], 5
  ),
  (
    'dips', 'Dips', 'Intermediate', 'Chest, Triceps, Shoulders',
    'A powerful pressing movement that builds the lower chest and triceps. Use parallel bars, chairs, or a bench to get started.',
    'https://images.pexels.com/photos/4803664/pexels-photo-4803664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Support yourself on parallel bars or chairs',
      'Lower your body by bending elbows',
      'Keep shoulders away from the ears',
      'Press back up to full lockout'
    ], 6
  ),
  (
    'pike-push-ups', 'Pike Push-ups', 'Intermediate', 'Shoulders, Triceps',
    'A vertical pressing move that shifts load onto the shoulders. The natural stepping stone toward handstand push-ups.',
    'https://images.pexels.com/photos/6740819/pexels-photo-6740819.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Start in a downward-dog position, hips high',
      'Bend elbows to lower your head toward the floor',
      'Keep hips stacked over shoulders throughout',
      'Press back up to the starting position'
    ], 7
  ),
  (
    'diamond-push-ups', 'Diamond Push-ups', 'Intermediate', 'Triceps, Chest',
    'A close-grip push-up variation that shifts emphasis onto the triceps for serious arm and pressing strength.',
    'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Form a diamond shape with thumbs and index fingers on the floor',
      'Keep elbows tucked close to your body',
      'Lower your chest to your hands',
      'Press back up to full extension'
    ], 8
  ),
  (
    'burpees', 'Burpees', 'Intermediate', 'Full Body, Cardio',
    'A full-body conditioning move that combines a squat, plank, push-up, and jump. Builds explosive power and cardio capacity.',
    'https://images.pexels.com/photos/4720236/pexels-photo-4720236.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Drop into a squat and place hands on the floor',
      'Kick feet back into a plank and perform a push-up',
      'Jump feet back up to your hands',
      'Explode upward into a jump, arms overhead'
    ], 9
  ),
  (
    'mountain-climbers', 'Mountain Climbers', 'Beginner', 'Core, Cardio',
    'A dynamic core and cardio move that drives the heart rate up while training hip flexor speed and core stability.',
    'https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Start in a high plank with hands under shoulders',
      'Drive one knee toward your chest',
      'Quickly switch legs in a running motion',
      'Keep hips low and core braced throughout'
    ], 10
  ),
  (
    'glute-bridges', 'Glute Bridges', 'Beginner', 'Glutes, Hamstrings',
    'A foundational hip-hinge move that builds glute strength and protects the lower back — great for beginners and warm-ups alike.',
    'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Lie on your back with knees bent, feet flat',
      'Drive through your heels to lift your hips',
      'Squeeze your glutes at the top',
      'Lower with control back to the floor'
    ], 11
  ),
  (
    'superman', 'Superman Hold', 'Beginner', 'Lower Back, Core',
    'An isometric posterior-chain exercise that strengthens the lower back and glutes, balancing out all the pressing work.',
    'https://images.pexels.com/photos/3839046/pexels-photo-3839046.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Lie face down with arms extended overhead',
      'Simultaneously lift arms, chest, and legs off the floor',
      'Hold, squeezing glutes and back muscles',
      'Lower with control and repeat'
    ], 12
  ),
  (
    'bulgarian-split-squats', 'Bulgarian Split Squats', 'Intermediate', 'Quads, Glutes',
    'A single-leg squat variation with the rear foot elevated. Builds serious leg strength while exposing and fixing imbalances.',
    'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Rest the top of one foot on a bench behind you',
      'Lower your back knee toward the floor',
      'Keep most of your weight on the front heel',
      'Drive through the front leg to stand back up'
    ], 13
  ),
  (
    'hanging-leg-raises', 'Hanging Leg Raises', 'Advanced', 'Core, Hip Flexors',
    'A demanding core exercise performed from a dead hang. Builds the raw core strength needed for front levers and the L-sit.',
    'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Hang from a bar with arms fully extended',
      'Keep legs straight and raise them to hip height or higher',
      'Avoid swinging — control the movement with your core',
      'Lower with control back to a full hang'
    ], 14
  ),
  (
    'handstand-push-ups', 'Handstand Push-ups', 'Advanced', 'Shoulders, Triceps',
    'An elite vertical pressing skill performed against a wall. Builds shoulder strength and body control few other moves can match.',
    'https://images.pexels.com/photos/2247179/pexels-photo-2247179.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Kick up into a handstand against a wall',
      'Lower your head slowly toward the floor',
      'Keep your core tight and body in a straight line',
      'Press back up to full lockout'
    ], 15
  ),
  (
    'muscle-ups', 'Muscle-ups', 'Advanced', 'Back, Chest, Triceps',
    'The ultimate pulling-to-pushing transition — combining a pull-up with a dip in one fluid motion over the bar.',
    'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Start with an explosive pull-up, pulling the bar toward your hips',
      'Transition your wrists over the bar as you rise',
      'Press up out of the dip position to full lockout',
      'Lower with control back to a hang'
    ], 16
  ),
  (
    'pistol-squats', 'Pistol Squats', 'Advanced', 'Quads, Glutes, Balance',
    'A single-leg squat to full depth. Demands and builds serious leg strength, balance, and ankle mobility.',
    'https://images.pexels.com/photos/6551144/pexels-photo-6551144.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Stand on one leg, extending the other straight in front of you',
      'Lower yourself down on the standing leg as deep as possible',
      'Keep your extended leg off the floor throughout',
      'Drive through your heel to return to standing'
    ], 17
  ),
  (
    'inverted-rows', 'Inverted Rows', 'Intermediate', 'Back, Biceps',
    'A horizontal pulling move under a low bar or table. Builds the back strength needed to progress toward pull-ups.',
    'https://images.pexels.com/photos/6740823/pexels-photo-6740823.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ARRAY[
      'Lie under a low bar and grab it with an overhand grip',
      'Keep your body in a straight line, heels on the floor',
      'Pull your chest up to the bar',
      'Lower with control to a full arm extension'
    ], 18
  )
ON CONFLICT (id) DO NOTHING;
