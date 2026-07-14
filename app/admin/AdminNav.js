'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '../components/LogoutButton';
import styles from './admin.module.css';

// Seções da navegação persistente do admin. Adicionar novas seções (ex.:
// Pedidos, Coleções) aqui é suficiente — sem tocar em layout ou CSS.
const SECOES = [
  { href: '/admin', label: 'Início', exact: true },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/estoque', label: 'Estoque' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar} aria-label="Navegação administrativa">
      <div>
        <span className={styles.brand}>Simplicitude — Admin</span>
        <ul className={styles.navList}>
          {SECOES.map((secao) => {
            const ativo = secao.exact
              ? pathname === secao.href
              : pathname === secao.href || pathname.startsWith(`${secao.href}/`);

            return (
              <li key={secao.href}>
                <Link
                  href={secao.href}
                  className={ativo ? `${styles.navLink} ${styles.navLinkAtivo}` : styles.navLink}
                  aria-current={ativo ? 'page' : undefined}
                >
                  {secao.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <LogoutButton />
    </nav>
  );
}
