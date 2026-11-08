'use client';

import { useRef, useState } from 'react';
import { envolverSelecao, formatarLista, inserirLink } from '@/lib/texto';
import TextoFormatado from '../components/TextoFormatado';
import styles from './BarraFormatacao.module.css';

// Campo de texto com formatação para quem não conhece Markdown: botões em português, pré-visualização
// e ajuda em linguagem comum. O valor guardado é o texto com as marcas (lib/texto.js).
// `onChange` recebe a string. `className` é a classe do textarea (cada formulário tem a sua).
export default function BarraFormatacao({ id, value, onChange, className, rows = 6, lang }) {
  const ref = useRef(null);
  const [previa, setPrevia] = useState(false);
  const ajudaId = `${id}-ajuda`;

  // Troca o trecho via insertText (mantém o Ctrl+Z); se o navegador não aplicar, grava o valor direto.
  function aplicar(op) {
    if (!op) return;
    const el = ref.current;
    const esperado = value.slice(0, op.de) + op.texto + value.slice(op.ate);
    el.focus();
    el.setSelectionRange(op.de, op.ate);
    document.execCommand('insertText', false, op.texto);
    const aplicou = el.value === esperado;
    if (!aplicou) onChange(esperado);
    const selecionar = () => el.setSelectionRange(op.selIni, op.selFim);
    if (aplicou) selecionar();
    else requestAnimationFrame(selecionar);
  }

  const selecao = () => [ref.current.selectionStart, ref.current.selectionEnd];

  function link() {
    const [ini, fim] = selecao();
    const rotulo = window.prompt('Qual texto vai aparecer na página?', value.slice(ini, fim));
    if (rotulo === null) return;
    const endereco = window.prompt('Cole aqui o endereço do site ou do Instagram (ex.: https://instagram.com/simplicitude.co)');
    if (endereco === null) return;
    const op = inserirLink(value, ini, fim, rotulo, endereco);
    if (!op) {
      window.alert('Esse endereço não parece um site. Ele deve começar com https://');
      return;
    }
    aplicar(op);
  }

  const botao = (rotulo, onClick) => (
    <button type="button" className={styles.botao} onClick={onClick} disabled={previa}>
      {rotulo}
    </button>
  );

  return (
    <div className={styles.campo}>
      <div className={styles.barra} role="toolbar" aria-label="Formatação do texto">
        {botao(<strong>Negrito</strong>, () => aplicar(envolverSelecao(value, ...selecao(), '**', 'texto em negrito')))}
        {botao(<em>Itálico</em>, () => aplicar(envolverSelecao(value, ...selecao(), '*', 'texto em itálico')))}
        {botao('Lista', () => aplicar(formatarLista(value, ...selecao(), 'ul')))}
        {botao('Lista numerada', () => aplicar(formatarLista(value, ...selecao(), 'ol')))}
        {botao('Link', link)}
        <button type="button" className={`${styles.botao} ${styles.previaBotao}`} onClick={() => setPrevia((p) => !p)}>
          {previa ? 'Voltar a editar' : 'Pré-visualizar'}
        </button>
      </div>

      <textarea
        ref={ref}
        id={id}
        className={className}
        lang={lang}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        hidden={previa}
        aria-describedby={ajudaId}
      />
      {previa && (
        <div className={styles.previa} aria-live="polite">
          <span className={styles.previaRotulo}>Assim aparece na loja:</span>
          {value.trim() ? <TextoFormatado texto={value} /> : <span className={styles.vazio}>Nada escrito ainda.</span>}
        </div>
      )}

      <span id={ajudaId} className={styles.ajuda}>
        Selecione um trecho e clique num botão para formatar. Os sinais que aparecem no texto (como * e -) são as
        marcas da formatação: não apague. Clique em Pré-visualizar para ver como fica na loja.
      </span>
    </div>
  );
}
