import type { Metadata } from 'next';
import GoalsClient from './GoalsClient';

export const metadata: Metadata = {
  title: 'Goals | FINCORE Milestone Tracker',
  description: 'Create savings goals, track progress, and plan upcoming financial milestones.',
};

export default function GoalsPage() {
  return <GoalsClient />;
}
