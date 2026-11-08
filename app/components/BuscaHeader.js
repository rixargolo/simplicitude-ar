'use client';

import { useEffect, useRef } from 'react';
import Form from 'next/form';
import { TERMO_MAX, TERMO_MIN } from '@/lib/busca';
import styles from './BuscaHeader.module.css';

// Lupa + campo de busca do Header (X16). O estado aberto mora no Header (abrir a busca fecha o menu e vice-versa).
// Abre com mouse em cima, clique/toque ou foco por teclado; fecha com Esc ou ao perder o foco/mouse com o campo vazio.
// prefetch={false}: o Header está em todas as páginas, o prefetch padrão chamaria /busca a cada página vista.
export default function BuscaHeader({ aberta, onAbrir, onFechar }) {
  const form = useRef(null);
  const campo = useRef(null);
  const lupa = useRef(null);
  const querFoco = useRef(false); // clique que abriu o campo: foca assim que ele fica visível
  const ignorarFoco = useRef(false); // foco devolvido à lupa pelo Esc não pode reabrir a busca

  useEffect(() => {
    if (aberta && querFoco.current) {
      querFoco.current = false;
      campo.current?.focus();
    }
  }, [aberta]);

  const fecharSeVazio = () => {
    if (!campo.current?.value) onFechar();
  };

  return (
    <Form
      ref={form}
      action="/busca"
      role="search"
      prefetch={false}
      className={`${styles.busca} ${aberta ? styles.aberta : ''}`}
      onMouseEnter={onAbrir}
      onMouseLeave={() => {
        if (!form.current.contains(document.activeElement)) fecharSeVazio();
      }}
      onBlur={(e) => {
        if (!form.current.contains(e.relatedTarget)) fecharSeVazio();
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !aberta) return;
        campo.current.value = '';
        onFechar();
        ignorarFoco.current = true;
        lupa.current.focus();
        ignorarFoco.current = false;
      }}
      onSubmit={() =>
        // depois de o Form ler o campo: limpa e fecha
        setTimeout(() => {
          if (campo.current) campo.current.value = '';
          onFechar();
        }, 0)
      }
    >
      <label htmlFor="busca-topo" className={styles.soLeitor}>
        Buscar produtos
      </label>
      <input
        ref={campo}
        id="busca-topo"
        type="search"
        name="q"
        required
        minLength={TERMO_MIN}
        maxLength={TERMO_MAX}
        placeholder="Buscar produtos"
        autoComplete="off"
        className={styles.campo}
      />
      <button
        ref={lupa}
        type="button"
        className={styles.lupa}
        aria-label={aberta ? 'Buscar' : 'Abrir busca'}
        aria-expanded={aberta}
        onFocus={() => {
          if (!ignorarFoco.current) onAbrir();
        }}
        onClick={() => {
          if (campo.current.value) form.current.requestSubmit();
          else if (aberta) campo.current.focus();
          else {
            querFoco.current = true;
            onAbrir();
          }
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
      </button>
    </Form>
  );
}
