import { redirect } from 'next/navigation';

// Redirect to the light vehicle report by default
export default function ReportsPage() {
  redirect('/reports/light');
}
