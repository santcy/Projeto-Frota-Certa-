import { redirect } from 'next/navigation';

// Redirect to the light vehicle unified report by default
export default function UnifiedReportsPage() {
  redirect('/reports/light/unified');
}
