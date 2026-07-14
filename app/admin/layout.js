import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNav from './AdminNav';
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
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
