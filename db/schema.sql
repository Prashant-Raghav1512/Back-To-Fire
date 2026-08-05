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
  message text NOT NULL,
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
