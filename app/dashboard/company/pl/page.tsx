import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PLClient from './PLClient';

export default async function PLPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return <PLClient />;
}
