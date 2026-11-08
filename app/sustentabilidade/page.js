import styles from './page.module.css';

export const metadata = { title: 'Sustentabilidade — Simplicitude' };

// Conteúdo ainda não existe (X18 fatia 3); texto provisório, confirmar com a dona.
export default function SustentabilidadePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Sustentabilidade</h1>
      <p className={styles.texto}>
        Estamos preparando esta página com carinho. Em breve, você vai conhecer como cuidamos de si,
        do outro e do todo.
      </p>
    </main>
  );
}
