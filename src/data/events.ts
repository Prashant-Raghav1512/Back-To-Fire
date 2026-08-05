import type { FitnessEvent } from '@/data/types';

// Static, like `benefits`/`navLinks` below in content.ts — not Neon-backed.
// Update this list by hand when an event is scheduled or wraps up; status
// (upcoming/ongoing/ended) is never stored here, only computed from these
// dates at render time (see src/lib/events.ts).
export const events: FitnessEvent[] = [
  {
    id: 'summer-shape-up-bootcamp',
    title: 'Summer Shape-Up Bootcamp',
    type: 'Bootcamp',
    format: 'Online',
    description:
      'A 5-week guided bootcamp that took beginners from their first squat to a full home routine, with live check-ins every Sunday over Zoom.',
    startDate: '2026-06-15',
    endDate: '2026-07-17',
    location: 'Live over Zoom',
    icon: 'Flame',
    agenda: [
      {
        date: '2026-06-15',
        title: 'Week 1 — Foundations',
        description: 'Live kickoff call, form-check for squats and push-ups, and the first at-home routine.',
      },
      {
        date: '2026-06-22',
        title: 'Week 2 — Building the habit',
        description: 'Added lunges and planks, plus daily accountability check-ins in the group chat.',
      },
      {
        date: '2026-06-29',
        title: 'Week 3 — Raising intensity',
        description: 'Introduced supersets and progressive overload, with mid-program 1:1 form-check calls.',
      },
      {
        date: '2026-07-06',
        title: 'Week 4 — Pushing further',
        description: 'Longer sessions and harder variations unlocked for anyone ready to progress.',
      },
      {
        date: '2026-07-13',
        title: 'Week 5 — Wrap-up',
        description: 'Final live session, individual progress reviews, and the closing celebration call.',
      },
    ],
    recap:
      '42 members completed all 5 weeks. Most went from struggling with a single push-up to doing 3 sets of 10+ with clean form, and the group chat from the bootcamp is still active today.',
  },
  {
    id: 'world-bodyweight-day-bengaluru',
    title: 'World Bodyweight Day Meetup — Bengaluru',
    type: 'Meetup',
    format: 'In-person',
    description:
      'A free morning meetup in the park to celebrate World Bodyweight Day — partner drills, a beginner-friendly circuit, and coffee afterward.',
    startDate: '2026-07-25',
    endDate: '2026-07-25',
    location: 'Cubbon Park, Bengaluru',
    icon: 'Users',
    agenda: [
      { date: '2026-07-25', time: '7:00 AM', title: 'Warm-up & welcome', description: 'Group mobility warm-up and quick introductions.' },
      { date: '2026-07-25', time: '7:20 AM', title: 'Partner circuit', description: 'A 30-minute partner-based bodyweight circuit for all levels.' },
      { date: '2026-07-25', time: '8:00 AM', title: 'Open skills jam', description: 'Casual practice time for handstands, pull-up bar tricks, and questions.' },
      { date: '2026-07-25', time: '8:45 AM', title: 'Coffee & wrap-up', description: 'Closing chat over coffee at a nearby cafe.' },
    ],
    recap:
      'Around 35 members showed up despite light rain. The circuit ran twice back-to-back to fit everyone in, and a few attendees have since started training together weekly on their own.',
  },
  {
    id: 'august-consistency-challenge',
    title: 'August Consistency Challenge',
    type: 'Challenge',
    format: 'Online',
    description:
      'Train at least 20 days this month and log it in the community group to unlock a free 1:1 form-check call. Any program counts — beginner to advanced.',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    location: 'Anywhere — track from home',
    icon: 'Trophy',
    agenda: [
      { date: '2026-08-01', title: 'Week 1 — Kickoff', description: 'Challenge opens: log your first session in the community group to get on the board.' },
      { date: '2026-08-08', title: 'Week 2 — Halfway check-in', description: 'Post a progress check-in in the group — share your day count so far.' },
      { date: '2026-08-15', title: 'Week 3 — Push through', description: 'The toughest week to stay consistent — extra reminders and a bonus mobility session get posted.' },
      { date: '2026-08-22', title: 'Week 4 — Final stretch', description: 'Last full week to bank your 20 days before the challenge closes.' },
      { date: '2026-08-31', title: 'Results & rewards', description: 'Logs close at midnight — everyone who hit 20+ days gets their free 1:1 form-check call booked.' },
    ],
  },
  {
    id: 'independence-day-calisthenics-jam',
    title: 'Independence Day Calisthenics Jam',
    type: 'Meetup',
    format: 'In-person',
    description:
      'An open-air group workout to mark Independence Day — a guided warm-up, a partner-based circuit, and a casual skills jam (handstands, pull-up bar tricks) for anyone who wants to try.',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    location: 'Cubbon Park, Bengaluru',
    icon: 'Users',
    agenda: [
      { date: '2026-08-15', time: '7:00 AM', title: 'Guided warm-up', description: 'Full-group mobility and activation warm-up to open the session.' },
      { date: '2026-08-15', time: '7:20 AM', title: 'Partner circuit', description: 'A partner-based bodyweight circuit scaled for every level.' },
      { date: '2026-08-15', time: '8:00 AM', title: 'Open skills jam', description: 'Try handstands, pull-up bar tricks, and skill work with coaches on hand to help.' },
      { date: '2026-08-15', time: '8:45 AM', title: 'Group photo & snacks', description: 'A group photo to mark the day, with light snacks and chai.' },
    ],
  },
  {
    id: 'first-pullup-workshop',
    title: 'Free Workshop: Your First Pull-Up',
    type: 'Workshop',
    format: 'Online',
    description:
      'A focused 60-minute live session on the exact progressions — negatives, band-assisted reps, scapular pulls — to go from zero pull-ups to your first clean rep.',
    startDate: '2026-09-05',
    endDate: '2026-09-05',
    location: 'Live over Zoom',
    icon: 'GraduationCap',
    agenda: [
      { date: '2026-09-05', time: '7:00 PM', title: 'Why pull-ups feel impossible', description: 'The biomechanics behind why pull-ups are hard, and the 3 progressions that fix it.' },
      { date: '2026-09-05', time: '7:15 PM', title: 'Live progression walkthrough', description: 'Negatives, band-assisted reps, and scapular pulls, demonstrated live.' },
      { date: '2026-09-05', time: '7:45 PM', title: 'Form review & Q&A', description: 'Send a video or ask live — open Q&A for the last 15 minutes.' },
    ],
  },
  {
    id: 'strength-builder-live-kickoff',
    title: 'Strength Builder Live Kickoff',
    type: 'Webinar',
    format: 'Online',
    description:
      'A live walkthrough of the Strength Builder program before the next cohort starts — what a week looks like, how supersets work, and a Q&A for anyone deciding if it is the right fit.',
    startDate: '2026-09-20',
    endDate: '2026-09-20',
    location: 'Live over Zoom',
    icon: 'Video',
    agenda: [
      { date: '2026-09-20', time: '6:30 PM', title: 'Program walkthrough', description: 'What a typical week in Strength Builder actually looks like.' },
      { date: '2026-09-20', time: '6:50 PM', title: 'Superset demo', description: 'A live demo of how supersets and progressive overload work in practice.' },
      { date: '2026-09-20', time: '7:10 PM', title: 'Open Q&A', description: 'Ask anything about whether the program is the right fit for you.' },
    ],
  },
  {
    id: 'born-to-fire-anniversary-meetup',
    title: 'Born to Fire Anniversary Meetup',
    type: 'Meetup',
    format: 'In-person',
    description:
      "Our community's biggest in-person gathering of the year — a full morning of group workouts, beginner-friendly stations, prizes, and meeting fellow members in person.",
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    location: 'Indiranagar, Bengaluru',
    icon: 'PartyPopper',
    agenda: [
      { date: '2026-11-14', time: '8:00 AM', title: 'Registration & warm-up', description: 'Check in, grab a T-shirt, and join the group warm-up.' },
      { date: '2026-11-14', time: '8:30 AM', title: 'Group workout stations', description: 'Beginner-friendly stations rotating every 10 minutes — something for every level.' },
      { date: '2026-11-14', time: '10:00 AM', title: 'Prizes & shoutouts', description: 'Recognizing the year\'s biggest progress stories from the community.' },
      { date: '2026-11-14', time: '10:30 AM', title: 'Community brunch', description: 'Wind down with food and conversation with fellow members.' },
    ],
  },
];
