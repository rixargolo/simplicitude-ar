import styles from './FotoPendente.module.css';

// Placeholder de espaço de foto ainda sem arquivo real (só preview: quem usa decide
// não renderizar em produção). Preenche o pai posicionado; `especificacao` diz o que subir.
export default function FotoPendente({ especificacao }) {
  return (
    <div className={styles.foto} role="img" aria-label={especificacao}>
      <p className={styles.texto} aria-hidden="true">
        {especificacao}
      </p>
    </div>
  );
}
