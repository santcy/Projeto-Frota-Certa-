import { redirect } from 'next/navigation';

// Redirect to the light vehicle checklist by default
export default function ChecklistPage() {
  redirect('/checklist/light');
}
