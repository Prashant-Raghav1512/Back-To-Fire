export type { Difficulty, Program, Exercise } from '@/data/types';
import type { Program, Exercise } from '@/data/types';
import programsData from '@/data/programs.json';
import exercisesData from '@/data/exercises.json';

// Generated at build time from Neon by scripts/fetch-content.mjs — see db/schema.sql for the source tables.
export const programs = programsData as Program[];
export const exercises = exercisesData as Exercise[];

export const benefits = [
  {
    icon: 'Dumbbell',
    title: 'No Equipment Needed',
    text: 'Your body is the only machine you need. Train anywhere — home, park, or hostel room.',
  },
  {
    icon: 'Activity',
    title: 'Builds Strength & Mobility',
    text: 'Develop real-world strength, joint health, and full range of motion at the same time.',
  },
  {
    icon: 'Calendar',
    title: 'Flexible Scheduling',
    text: 'No gym hours, no commute. Work out on your schedule, whether 6 AM or midnight.',
  },
  {
    icon: 'Move',
    title: 'Improves Body Control',
    text: 'Master your own bodyweight and unlock impressive skills like handstands and levers.',
  },
];

export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Programs', path: '/programs' },
  { label: 'Exercises', path: '/exercises' },
  { label: 'Contact', path: '/contact' },
];
