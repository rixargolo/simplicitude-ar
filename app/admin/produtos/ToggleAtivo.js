'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './produtos.module.css';

// Alterna o campo `ativo` de um produto direto na listagem, sem abrir o
// formulário completo. Não é delete físico — só liga/desliga a visibilidade
// na loja (que filtra ativo=true em lib/produtos.js).
export default function ToggleAtivo({ id, ativo }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  async function handleToggle() {
    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: !ativo })
      .eq('id', id);

    setSalvando(false);

    if (error) {
      alert('Não foi possível atualizar o status do produto.');
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      className={ativo ? styles.statusAtivo : styles.statusInativo}
      onClick={handleToggle}
      disabled={salvando}
    >
      {salvando ? '...' : ativo ? 'Ativo' : 'Inativo'}
    </button>
  );
}
