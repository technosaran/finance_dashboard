import { readFileSync, writeFileSync } from 'node:fs';

const f = 'app/components/FinanceContext.tsx';
let c = readFileSync(f, 'utf8');

// Fix 1: Replace the table param type — use keyof Database["public"]["Tables"]
// which includes all typed table names (accounts, bonds, fno_trades, etc.)
c = c.replace(
  'table: Parameters<typeof supabase.from>[0],',
  'table: keyof Database["public"]["Tables"],'
);

// Fix 2: Also handle the case where the old string param survived
c = c.replace(
  '    table: string,\r\n    label: string,\r\n    setter: React.Dispatch',
  '    table: keyof Database["public"]["Tables"],\r\n    label: string,\r\n    setter: React.Dispatch'
);
c = c.replace(
  '    table: string,\n    label: string,\n    setter: React.Dispatch',
  '    table: keyof Database["public"]["Tables"],\n    label: string,\n    setter: React.Dispatch'
);

writeFileSync(f, c, 'utf8');

// Verify
if (c.includes('keyof Database["public"]["Tables"]')) {
  console.log('SUCCESS: table param is now typed');
} else {
  console.log('WARN: pattern not found, showing context:');
  const idx = c.indexOf('makeDeleteFromTable');
  console.log(c.slice(idx, idx + 300));
}
