import Link from 'next/link';
import styles from './EmBreve.module.css';

// Página mockup "em coming soon" (só existe com NEXT_PUBLIC_MOCKUPS=1).
export default function EmBreve({ titulo }) {
  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.texto}>Em breve.</p>
      <Link href="/loja" className={styles.botao}>
        Ver a loja
      </Link>
    </main>
  );
}
