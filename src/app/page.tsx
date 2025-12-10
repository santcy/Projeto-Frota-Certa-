import { redirect } from 'next/navigation';

// Redirect to the login page by default
export default function HomePage() {
  redirect('/login');
}
