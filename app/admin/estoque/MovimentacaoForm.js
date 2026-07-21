'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './MovimentacaoForm.module.css';

// Admin só pode registrar reposição (entrada) e ajuste (correção manual).
// `venda` e `cancelamento` ficam reservados para o fluxo de checkout, ainda
// não implementado.
const TIPOS = [
  { value: 'reposicao', label: 'Reposição (entrada)' },
  { value: 'ajuste', label: 'Ajuste (correção)' },
];

export default function MovimentacaoForm({ produtos, produtoIdInicial }) {
  const router = useRouter();

  const [produtoId, setProdutoId] = useState(produtoIdInicial ?? '');
  const [tipo, setTipo] = useState('reposicao');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    if (!produtoId) {
      setErro('Selecione o produto.');
      return;
    }

    const quantidadeNum = Number(quantidade);

    if (!Number.isInteger(quantidadeNum) || quantidadeNum === 0) {
      setErro('Informe uma quantidade válida (número inteiro diferente de zero).');
      return;
    }

    if (tipo === 'reposicao' && quantidadeNum <= 0) {
      setErro('Reposição precisa de uma quantidade positiva (é entrada de estoque).');
      return;
    }

    if (tipo === 'ajuste' && !observacao.trim()) {
      setErro('Ajustes de estoque exigem uma observação explicando o motivo.');
      return;
    }

    setSalvando(true);
    const supabase = createClient();

    const payload = {
      produto_id: produtoId,
      tipo,
      quantidade: quantidadeNum,
      observacao: observacao.trim() || null,
    };

    try {
      await criarMovimentacao(supabase, payload);

      router.push('/admin/estoque');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro(mensagemErroAmigavel(err));
      setSalvando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Nova movimentação de estoque</h1>

      <label className={styles.field}>
        <span className={styles.label}>Produto</span>
        <select
          className={styles.select}
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione um produto
          </option>
          {produtos.map((produto) => (
            <option key={produto.id} value={produto.id}>
              {produto.nome} (estoque atual: {produto.estoque ?? '—'})
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Tipo</span>
        <select
          className={styles.select}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Quantidade</span>
        <input
          className={styles.input}
          type="number"
          step="1"
          min={tipo === 'reposicao' ? 1 : undefined}
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          required
        />
        <span className={styles.hint}>
          {tipo === 'reposicao'
            ? 'Sempre positiva — quantidade que está entrando no estoque.'
            : 'Positiva para corrigir para mais, negativa para corrigir para menos.'}
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Observação {tipo === 'ajuste' ? '(obrigatória)' : '(opcional)'}
        </span>
        <textarea
          className={styles.textarea}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={4}
        />
      </label>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.actions}>
        <button className={styles.cta} type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar movimentação'}
        </button>
      </div>
    </form>
  );
}

// Traduz erros do banco (em especial o bloqueio de estoque negativo feito
// pela trigger calcular_estoque_movimentacao) em mensagens amigáveis.
function mensagemErroAmigavel(err) {
  const mensagem = (err?.message || '').toLowerCase();

  if (mensagem.includes('negativ')) {
    return 'Essa movimentação deixaria o estoque negativo — verifique a quantidade informada.';
  }

  return 'Não foi possível registrar a movimentação. Tente novamente.';
}

// Insere a movimentação. O estoque do produto (produtos.estoque) e o
// estoque_resultante desta linha são calculados pela trigger do banco —
// a aplicação nunca escreve neles diretamente.
async function criarMovimentacao(supabase, payload) {
  const { error } = await supabase.from('estoque_movimentacoes').insert(payload);
  if (error) throw new Error(error.message);
}
