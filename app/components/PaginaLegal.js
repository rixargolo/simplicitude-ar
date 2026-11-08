import { DATA_ATUALIZACAO_LEGAL, lerTextoLegal } from '@/lib/legal';
import TextoFormatado from './TextoFormatado';
import styles from './PaginaLegal.module.css';

// Páginas legais: título + data + texto de content/legal/{arquivo}.md (formatação de lib/texto.js).
export default function PaginaLegal({ titulo, arquivo }) {
  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p className={styles.data}>Atualizado em {DATA_ATUALIZACAO_LEGAL}</p>
      <TextoFormatado texto={lerTextoLegal(arquivo)} />
    </main>
  );
}
