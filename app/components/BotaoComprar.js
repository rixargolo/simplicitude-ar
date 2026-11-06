import { linkCompra } from '@/lib/whatsapp';
import styles from './BotaoComprar.module.css';

// Único lugar que monta o link de compra (WhatsApp, temporário até o checkout). Para registrar o
// clique no futuro: virar 'use client' e acrescentar onClick com navigator.sendBeacon para uma
// rota do servidor (ADR 0001), sem bloquear a navegação. Segue link direto ao wa.me, sem
// redirecionamento no meio, para abrir bem no navegador interno do Instagram.
export default function BotaoComprar({ nome, url, rotulo = 'Comprar' }) {
  return (
    <a
      href={linkCompra(nome, url)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.botao}
    >
      {rotulo}
      <span className={styles.aviso}> (abre em nova aba)</span>
    </a>
  );
}
