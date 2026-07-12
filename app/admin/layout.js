import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '../components/LogoutButton';
import styles from './admin.module.css';

// Checagem defensiva de sessão — o middleware já protege /admin/*, mas
// esta verificação em profundidade garante a proteção mesmo se o
// middleware for removido ou mal configurado no futuro.
export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <header className={styles.header}>
        <span className={styles.brand}>Simplicitude — Admin</span>
        <LogoutButton />
      </header>
      {children}
    </>
  );
}
