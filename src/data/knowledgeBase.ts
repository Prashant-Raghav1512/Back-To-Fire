import { getEventKnowledgeChunks } from '@/lib/events';

export interface KnowledgeChunk {
  id: string;
  title: string;
  text: string;
}

// Source content for the Contact page's FAQ search. Kept as structured
// chunks (rather than parsed from raw text) so each has a clean title and
// clean punctuation for display in chat bubbles.
const staticKnowledgeBase: KnowledgeChunk[] = [
  {
    id: 'brand-overview',
    title: 'About Born to Fire',
    text: `Born to Fire is a calisthenics and home fitness platform built for people in India who want to get strong, mobile, and healthy without needing a gym membership or expensive equipment. We teach bodyweight training - using nothing but your own body as resistance - through structured workout programs, an exercise library, and educational content on fitness fundamentals.

Our slogan is "No weights. No limits. Master the machine you were born in." You don't need external weights or machines to get strong - your own body is the only equipment you'll ever truly need, and calisthenics is how you learn to master it.

Born to Fire exists because gym memberships are often expensive, inconvenient, or intimidating for beginners. Calisthenics removes those barriers: it can be done at home, in a park, or in a small room, using body weight alone or simple items like a sturdy chair, a doorway pull-up bar, or a yoga mat.

Born to Fire is for students (18-25) who want to start fitness without expensive gym memberships, working professionals (25-40) who want convenient home workouts that fit a busy schedule, complete beginners who want a simple guided starting point, and senior citizens looking for beginner-friendly movement to stay mobile and healthy.`,
  },
  {
    id: 'what-is-calisthenics',
    title: 'What is calisthenics?',
    text: `Calisthenics is a form of strength training that uses your own body weight as resistance instead of external weights like dumbbells or machines. Classic calisthenics movements include push-ups, pull-ups, squats, lunges, planks, and dips.

Calisthenics builds functional strength - strength that translates directly into everyday movement, such as climbing stairs, carrying groceries, getting up off the floor, or picking up a child. Unlike isolated machine exercises, calisthenics movements typically work multiple muscle groups and joints together, improving coordination and full-body control along with raw strength.

Because it requires no equipment or minimal equipment, calisthenics can be practiced almost anywhere: a bedroom, a terrace, a park, or a hostel room.`,
  },
  {
    id: 'why-calisthenics',
    title: 'Why choose calisthenics',
    text: `No gym membership required - train at home, outdoors, or anywhere with floor space. Little to no equipment needed - most exercises use body weight alone. Builds functional, real-world strength rather than isolated muscle size. Improves flexibility, joint mobility, and body control alongside strength. Scales to any fitness level - from a senior citizen doing wall push-ups to an advanced athlete training a one-arm pull-up. Cost-effective, with no recurring membership fees or expensive equipment purchases. Flexible scheduling - train whenever it suits your day, no commute to a gym. Builds discipline and consistency through simple, repeatable routines.`,
  },
  {
    id: 'mission-vision',
    title: 'Mission and vision',
    text: `Our mission is to make fitness accessible, affordable, and sustainable for every Indian, by teaching bodyweight training that requires no gym and no expensive equipment - only consistency.

Our vision is a future where anyone - a student, a working professional, or a senior citizen - can build a stronger, healthier body using nothing but their own body weight, guided by clear, beginner-friendly programs.`,
  },
  {
    id: 'general-benefits',
    title: 'Benefits of calisthenics',
    text: `Calisthenics builds functional strength that supports everyday movement, improves flexibility and joint mobility over time, and requires no expensive equipment or gym membership. It can be done almost anywhere - home, park, hostel, or office. It improves body control, balance, and coordination, and scales naturally from beginner to advanced skill levels. It supports weight management alongside a balanced diet, builds mental discipline and consistency, carries a lower injury risk than heavy external-weight training when done with correct form, and encourages long-term sustainable habits rather than short-lived gym phases.`,
  },
  {
    id: 'program-beginner',
    title: 'Beginner program: Foundations',
    text: `Foundations is our beginner program - 4 weeks, 3 sessions per week, 20-30 minutes per session. It's designed for people who are completely new to bodyweight training or returning to exercise after a long break. The program focuses on learning correct movement patterns - squatting, pushing, and holding a stable core - before adding intensity. Expect knee push-ups, bodyweight squats, assisted planks, and basic mobility drills. The goal by the end of 4 weeks is to move comfortably through the fundamental patterns with good form and build the habit of regular training. It's for first-time exercisers, students with no gym background, senior citizens easing into movement, and anyone recovering from a long inactive period.`,
  },
  {
    id: 'program-intermediate',
    title: 'Intermediate program: Strength Builder',
    text: `Strength Builder is our intermediate program - 6 weeks, 4 sessions per week, 35-45 minutes per session. It's for people who already have a foundation of basic bodyweight strength and want to progress toward more advanced movements like full push-ups, assisted pull-ups, and dips. The program introduces higher training volume, supersets (pairing two exercises back-to-back), and progressive overload - gradually increasing reps, hold times, or difficulty each week. It's for anyone who has completed a beginner program or already trains casually and wants a structured path to visible strength gains.`,
  },
  {
    id: 'program-advanced',
    title: 'Advanced program: Elite Calisthenics',
    text: `Elite Calisthenics is our advanced program - 8 weeks, 5 sessions per week, 45-60 minutes per session. It targets experienced trainees working toward advanced skill movements such as pull-ups for reps, dips for reps, pistol squats, and progressions toward muscle-ups and handstand push-ups. Programming is intensity- and skill-focused, with an emphasis on technique refinement, controlled tempo, and structured progression toward advanced static holds and dynamic movements. It's for trainees with solid bodyweight strength who are ready to chase advanced skills and higher-intensity training.`,
  },
  {
    id: 'exercise-pushups',
    title: 'Push-ups',
    text: `Push-ups are a beginner-to-intermediate exercise that works the chest, shoulders, triceps, and core muscles. Starting in a plank position with hands under the shoulders, lower the chest toward the floor while keeping the body in a straight line, then push back up.

Form tips: keep the core braced and hips in line with the shoulders and heels - avoid letting the hips sag or pike upward. Lower with control rather than dropping quickly.

Easier variation: knee push-ups, or incline push-ups with hands on a raised surface like a bench or step. Harder variation: decline push-ups (feet raised), diamond push-ups (hands close together), or archer push-ups.`,
  },
  {
    id: 'exercise-pullups',
    title: 'Pull-ups',
    text: `Pull-ups are an intermediate-to-advanced exercise that works the back (lats), biceps, shoulders, and core muscles. Hang from a bar with an overhand grip and pull the body up until the chin clears the bar, then lower back down with control. It's one of the most effective exercises for building upper-back and grip strength, and requires access to a pull-up bar or a sturdy door-frame bar, playground bar, or similar.

Form tips: start from a full hang with arms straight, avoid excessive swinging or kipping, and pull the elbows down and back rather than just curling with the arms.

Easier variation: assisted pull-ups using a resistance band, negative pull-ups (slow lowering only), or inverted rows on a low bar. Harder variation: weighted pull-ups, wide-grip pull-ups, or working toward muscle-ups.`,
  },
  {
    id: 'exercise-squats',
    title: 'Squats',
    text: `Squats are a beginner exercise that works the quadriceps, glutes, hamstrings, and core muscles. Standing with feet shoulder-width apart, bend the knees and hips to lower the body as if sitting back into a chair, keeping the chest upright, then stand back up. It's one of the safest exercises for beginners and seniors alike.

Form tips: keep the knees tracking in line with the toes, weight through the heels and mid-foot, and chest lifted throughout the movement.

Easier variation: box squats or chair squats, holding onto a support for balance. Harder variation: jump squats, pistol squats (single-leg), or Bulgarian split squats.`,
  },
  {
    id: 'exercise-lunges',
    title: 'Lunges',
    text: `Lunges are a beginner-to-intermediate exercise that works the quadriceps, glutes, and hamstrings muscles, and improves balance and stability. Step forward (or backward) into a split stance and lower the body until both knees are bent near 90 degrees, then return to standing. They train each leg individually, improving balance and correcting strength imbalances between the two sides of the body.

Form tips: keep the front knee aligned over the ankle rather than pushing past the toes, and keep the torso upright throughout.

Easier variation: static lunges holding onto a wall or chair for balance, or a shorter range of motion. Harder variation: walking lunges, jumping lunges, or reverse lunges with a raised back foot.`,
  },
  {
    id: 'exercise-plank',
    title: 'Plank',
    text: `The plank is a beginner exercise that works the core (abs, lower back) and shoulder muscles. It's a static hold performed on the forearms and toes (or knees for an easier version), keeping the body in a straight line from head to heels. It's low-impact and joint-friendly, suitable for nearly all fitness levels.

Form tips: keep the hips level - not sagging down or piking up - and squeeze the core and glutes throughout the hold. Breathe steadily rather than holding your breath.

Easier variation: knee plank, or a shorter hold duration building up gradually (start with 10-15 seconds). Harder variation: extended holds, side planks, or plank with shoulder taps.`,
  },
  {
    id: 'exercise-dips',
    title: 'Dips',
    text: `Dips are an intermediate exercise that works the triceps, chest, and shoulder muscles. Lower and raise the body using parallel bars, a sturdy chair, or a bench, bending the elbows to lower the body and pressing back up. They're one of the most effective bodyweight exercises for building pushing strength in the triceps and chest.

Form tips: keep the shoulders down away from the ears and avoid lowering so far that it causes shoulder strain - a comfortable range of motion matters more than depth when starting out.

Easier variation: bench dips with knees bent and feet close to the body. Harder variation: parallel bar dips with a straight-leg position, or weighted dips.`,
  },
  {
    id: 'faq-equipment',
    title: 'FAQ: Do I need equipment?',
    text: `No. Most beginner exercises like squats, push-ups, lunges, and planks require no equipment at all - just floor space. Some intermediate and advanced movements like pull-ups and dips benefit from access to a bar or sturdy furniture, but there are equipment-free alternatives for almost every exercise.`,
  },
  {
    id: 'faq-frequency',
    title: 'FAQ: How often should I train?',
    text: `Beginners typically train 3 times per week to allow the body time to recover. Intermediate trainees often move to 4 sessions per week, and advanced trainees may train 5 times per week. Rest days are an important part of progress, not something to skip.`,
  },
  {
    id: 'faq-pullups-beginner',
    title: 'FAQ: Can a complete beginner do pull-ups?',
    text: `Most beginners cannot do a full pull-up right away, and that's completely normal. Start with assisted variations like negative pull-ups (slowly lowering from the top) or resistance-band-assisted pull-ups, and progress from there.`,
  },
  {
    id: 'faq-weight-loss',
    title: 'FAQ: Is calisthenics good for weight loss?',
    text: `Calisthenics builds strength and can raise your overall activity level, both of which help you lose weight and support weight management when combined with a balanced diet. It's not a substitute for proper nutrition, but it is an effective and sustainable form of exercise for weight loss.`,
  },
  {
    id: 'faq-results-timeline',
    title: 'FAQ: How long until I see results?',
    text: `Most beginners notice improved energy and easier movement within 2-3 weeks of consistent training, with visible strength and body composition changes typically becoming noticeable after 6-8 weeks of regular practice.`,
  },
  {
    id: 'faq-seniors',
    title: 'FAQ: Is calisthenics safe for senior citizens?',
    text: `Yes, when scaled appropriately. Calisthenics is a safe option for old people and senior citizens who want to stay active. Seniors should start with beginner-friendly, low-impact movements - such as chair squats, wall push-ups, and gentle stretching - and progress gradually. Anyone with existing health conditions should consult a doctor before starting a new exercise program.`,
  },
  {
    id: 'faq-flexibility',
    title: 'FAQ: Do I need to be flexible before I start?',
    text: `No. Flexibility improves as a natural result of consistent training. You do not need to be flexible to begin - you build flexibility over time through practice.`,
  },
  {
    id: 'faq-no-bar',
    title: "FAQ: What if I don't have a pull-up bar?",
    text: `Many pull-up exercises can be substituted with inverted rows using a sturdy table, resistance band pulldowns, or simply focusing on other pulling movements until a bar becomes available, such as at a park or public gym.`,
  },
  {
    id: 'faq-overweight-beginner',
    title: "FAQ: Can I start if I'm overweight or completely new to exercise?",
    text: `Yes. Beginner programs are designed to start at a comfortable level and progress gradually. It's important to prioritize correct form over speed or repetitions when starting out.`,
  },
  {
    id: 'faq-slogan',
    title: 'FAQ: What does the Born to Fire slogan mean?',
    text: `Our slogan is "No weights. No limits. Master the machine you were born in." It means you don't need external weights or gym machines to build real strength - your own body is the machine, and calisthenics is how you learn to master it, without limits on where or how you train.`,
  },
  {
    id: 'faq-vs-weightlifting',
    title: 'FAQ: How is calisthenics different from weightlifting?',
    text: `Weightlifting typically uses external weights (dumbbells, barbells, machines) to add resistance, while calisthenics uses your own body weight. Calisthenics tends to build more functional, full-body strength and requires far less equipment, while weightlifting can more easily target specific muscles with precise, incremental load increases.`,
  },
  {
    id: 'contact-info',
    title: 'Contact us',
    text: `You can reach Born to Fire by email at hello@borntofire.in, by phone at +91 98765 43210, or visit our address, located in Indiranagar, Bengaluru, Karnataka. You can also use the contact form on this page to send a message directly.`,
  },
];

// Event chunks are generated, not hand-written like the array above — see
// the comment on getEventKnowledgeChunks in src/lib/events.ts for why.
export const knowledgeBase: KnowledgeChunk[] = [...staticKnowledgeBase, ...getEventKnowledgeChunks()];
