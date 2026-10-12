import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getAdminSession()) redirect('/admin');
  return <LoginClient />;
}
