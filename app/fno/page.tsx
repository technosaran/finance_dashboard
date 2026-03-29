import FnOClient from './FnOClient';

export const metadata = {
  title: 'FnO Portfolio | FINCORE',
  description: 'Track futures and options trades with position, charge, and P&L details.',
};

export default function FnOPage() {
  return <FnOClient />;
}
