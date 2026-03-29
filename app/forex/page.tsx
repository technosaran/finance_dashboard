import type { Metadata } from 'next';
import ForexClient from './ForexClient';

export const metadata: Metadata = {
  title: 'Forex | FINCORE Currency Portfolio',
  description: 'Track currency positions, rate movement, and forex trade history.',
};

export default function ForexPage() {
  return <ForexClient />;
}
