import Link from 'next/link';
import styles from './not-found.module.css';

export const metadata = { title: 'Página não encontrada · Simplicitude' };

// Cobre rota inexistente, notFound() de /loja/[slug] e exigirMockups() em produção.
// Texto provisório: confirmar com a dona.
export default function NotFound() {
  return (
    <main className={styles.main}>
      <p className={styles.rotulo}>Página não encontrada</p>
      <h1 className={styles.titulo}>Este caminho se perdeu na floresta.</h1>
      <p className={styles.texto}>
        A página que você procura não existe ou mudou de lugar. O chocolate continua aqui.
      </p>
      <div className={styles.acoes}>
        <Link href="/loja" className={styles.botao}>
          Ver a loja
        </Link>
        <Link href="/" className={styles.secundario}>
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
