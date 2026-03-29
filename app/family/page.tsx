import type { Metadata } from 'next';
import FamilyClient from './FamilyClient';

export const metadata: Metadata = {
  title: 'Family Transfers | FINCORE',
  description: 'Record family transfers, recurring support, and shared obligations.',
};

export default function FamilyPage() {
  return <FamilyClient />;
}
