'use client';

import { useEffect, useRef, useState } from 'react';
import { slugDoEndereco } from '@/lib/produtos';
import styles from './categorias/CategoriaForm.module.css';

// Por tipo: o que a pessoa deve digitar, o prefixo do endereço público (null = sem página) e o nome para o aviso.
const TIPOS = {
  produto: {
    ajuda: 'Só a parte que vem depois de /loja/, ex.: bombons-sortidos. Não cole o link inteiro.',
    prefixo: '/loja/',
    de: 'um produto',
  },
  categoria: {
    ajuda: 'Só a palavra que identifica a categoria no endereço, ex.: chocolates. Não cole o link inteiro.',
    prefixo: '/loja?categoria=',
    de: 'uma categoria',
  },
  colecao: {
    ajuda: 'Só a palavra que identifica a coleção no endereço, ex.: inspirar. Não cole o link inteiro.',
    prefixo: '/loja?colecao=',
    de: 'uma coleção',
  },
  tag: {
    ajuda: 'Só letras, números e hífen, ex.: sem-gluten. A tag ainda não tem página própria.',
    prefixo: null,
    de: 'uma tag',
  },
};

// Campo "final do endereço" dos formulários do admin. Nasce travado, mostrando o slug gerado do nome; "Editar endereço"
// destrava. Destravado, evita colar o link inteiro e, se colarem, extrai o slug.
// `avisoEdicao`: texto mostrado ao destravar (só em registro já existente; falsy = sem aviso).
// `children`: informações fixas do formulário.
export default function CampoSlug({ id, tipo, value, onChange, sugestao, required, avisoEdicao, children }) {
  const t = TIPOS[tipo];
  const [origem, setOrigem] = useState('');
  useEffect(() => setOrigem(window.location.origin), []);
  const [aviso, setAviso] = useState('');
  const [destravado, setDestravado] = useState(false);
  const entrada = useRef(null);

  function destravar() {
    setDestravado(true);
    if (!value && sugestao) onChange(sugestao); // parte do slug gerado, em vez de campo vazio
    setTimeout(() => entrada.current?.focus(), 0);
  }

  function aoSair() {
    const slug = slugDoEndereco(value, tipo);
    const eraLink = /[/?#&=]/.test(value);
    onChange(slug);
    if (!eraLink) return;
    setAviso(
      slug
        ? 'Você colou um link: ficou só a parte final.'
        : `Esse link não tem o endereço de ${t.de}: digite só a parte final.`,
    );
  }

  return (
    <div className={styles.field}>
      <div className={styles.slugCabecalho}>
        <label htmlFor={id} className={styles.label}>Final do endereço (slug)</label>
        {!destravado && (
          <button type="button" className={styles.linkSlug} onClick={destravar}>
            Editar endereço
          </button>
        )}
      </div>
      <input
        id={id}
        ref={entrada}
        className={styles.input}
        type="text"
        value={destravado ? value : value || sugestao || ''}
        readOnly={!destravado}
        onChange={(e) => {
          setAviso('');
          onChange(e.target.value);
        }}
        onBlur={destravado ? aoSair : undefined}
        placeholder={sugestao || (required ? undefined : 'gerado a partir do nome')}
        aria-describedby={`${id}-ajuda`}
        autoCapitalize="none"
        spellCheck={false}
        required={required}
      />
      <span id={`${id}-ajuda`} className={styles.ajuda}>
        {destravado && `${t.ajuda} `}
        {t.prefixo && (
          <>
            Fica assim: {origem}{t.prefixo}<strong>{value || sugestao || '…'}</strong>
          </>
        )}
        {!destravado && !t.prefixo && 'Gerado a partir do nome. Use "Editar endereço" para mudar.'}
      </span>
      {destravado && avisoEdicao && <span className={styles.aviso} role="status">{avisoEdicao}</span>}
      {aviso && <span className={styles.ajuda} role="status">{aviso}</span>}
      {children}
    </div>
  );
}
