import type { Metadata } from 'next';
import BondsClient from './BondsClient';

export const metadata: Metadata = {
  title: 'Bonds | FINCORE Income Portfolio',
  description: 'Track bond holdings, yields, and fixed-income transactions.',
};

export default function BondsPage() {
  return <BondsClient />;
}
