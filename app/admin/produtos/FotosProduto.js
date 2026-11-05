'use client';

import { useEffect, useRef, useState } from 'react';
import { FOCO_PADRAO, ZOOM_PADRAO } from '@/lib/foco';
import { MAX_FOTOS, TIPOS_ACEITOS, mover, tornarPrincipal, validarArquivos } from '@/lib/fotos';
import SeletorFoco from './SeletorFoco';
import styles from './FotosProduto.module.css';

// Lista de fotos do produto. `fotos` = [{ chave, caminho?, arquivo?, url, foco_x, foco_y, zoom, alt }]
// (a primeira é a principal; `arquivo` só existe nas ainda não enviadas, com `url` blob:).
// Quem guarda a lista e envia ao Storage ao salvar é o ProdutoForm. Reordenar é por botões
// (teclado e celular); nada de arrastar.
export default function FotosProduto({ fotos, onChange, nomeProduto }) {
  const [erros, setErros] = useState([]);
  const [ajustandoChave, setAjustandoChave] = useState(null);
  const listaRef = useRef(null);
  const focoPendente = useRef(null);
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;

  // libera os blob: das fotos ainda não enviadas ao sair da tela
  useEffect(
    () => () => fotosRef.current.forEach((f) => f.arquivo && URL.revokeObjectURL(f.url)),
    [],
  );

  // depois de mover, o botão sai do lugar no DOM e o foco se perderia: devolve ao mesmo botão
  // (ou ao oposto, se ele ficou desabilitado na ponta)
  useEffect(() => {
    const pendente = focoPendente.current;
    if (!pendente) return;
    focoPendente.current = null;
    const alvo = (acao) => listaRef.current?.querySelector(`[data-chave="${pendente.chave}"][data-acao="${acao}"]:not(:disabled)`);
    (alvo(pendente.acao) ?? alvo(pendente.acao === 'subir' ? 'descer' : 'subir'))?.focus();
  }, [fotos]);

  const ajustando = fotos.find((f) => f.chave === ajustandoChave) ?? fotos[0];

  function adicionar(event) {
    const { aceitos, erros: novosErros } = validarArquivos(Array.from(event.target.files ?? []), fotos.length);
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    setErros(novosErros);
    if (aceitos.length === 0) return;
    onChange([
      ...fotos,
      ...aceitos.map((arquivo) => ({
        chave: crypto.randomUUID(),
        arquivo,
        url: URL.createObjectURL(arquivo),
        foco_x: FOCO_PADRAO,
        foco_y: FOCO_PADRAO,
        zoom: ZOOM_PADRAO,
        alt: '',
      })),
    ]);
  }

  function reordenar(nova, chave, acao) {
    focoPendente.current = { chave, acao };
    onChange(nova);
  }

  function excluir(i) {
    const foto = fotos[i];
    if (foto.arquivo) URL.revokeObjectURL(foto.url);
    setErros([]);
    onChange(fotos.filter((_, j) => j !== i));
  }

  function atualizar(chave, campos) {
    onChange(fotos.map((f) => (f.chave === chave ? { ...f, ...campos } : f)));
  }

  return (
    <div className={styles.fotos}>
      <label className={styles.field}>
        <span className={styles.rotulo}>
          Fotos ({fotos.length} de {MAX_FOTOS})
        </span>
        <input
          className={styles.arquivo}
          type="file"
          multiple
          accept={TIPOS_ACEITOS.join(',')}
          onChange={adicionar}
          disabled={fotos.length >= MAX_FOTOS}
        />
        <span className={styles.ajuda}>JPEG, PNG ou WebP, até 5 MB cada. A primeira da lista é a principal (a do card).</span>
      </label>

      {erros.length > 0 && (
        <ul className={styles.erros} role="alert">
          {erros.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {fotos.length > 0 && (
        <ol className={styles.lista} ref={listaRef}>
          {fotos.map((foto, i) => {
            const n = i + 1;
            return (
              <li key={foto.chave} className={styles.item}>
                <div className={styles.miniatura}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pode ser blob: do arquivo ainda não enviado */}
                  <img src={foto.url} alt="" className={styles.miniaturaFoto} />
                </div>

                <div className={styles.corpo}>
                  <span className={styles.titulo}>
                    Foto {n}
                    {i === 0 && <span className={styles.selo}>Principal</span>}
                    {foto.arquivo && <span className={styles.novo}>nova, envia ao salvar</span>}
                  </span>

                  <label className={styles.alt}>
                    <span>Texto alternativo (opcional)</span>
                    <input
                      type="text"
                      value={foto.alt ?? ''}
                      onChange={(e) => atualizar(foto.chave, { alt: e.target.value })}
                      placeholder={nomeProduto || 'Descreva a foto'}
                    />
                  </label>

                  <div className={styles.botoes}>
                    <button type="button" data-chave={foto.chave} data-acao="subir" disabled={i === 0} aria-label={`Subir a foto ${n}`} onClick={() => reordenar(mover(fotos, i, -1), foto.chave, 'subir')}>
                      Subir
                    </button>
                    <button type="button" data-chave={foto.chave} data-acao="descer" disabled={i === fotos.length - 1} aria-label={`Descer a foto ${n}`} onClick={() => reordenar(mover(fotos, i, 1), foto.chave, 'descer')}>
                      Descer
                    </button>
                    <button type="button" disabled={i === 0} aria-label={`Tornar a foto ${n} a principal`} onClick={() => onChange(tornarPrincipal(fotos, i))}>
                      Tornar principal
                    </button>
                    <button type="button" aria-pressed={ajustando?.chave === foto.chave} aria-label={`Ajustar o enquadramento da foto ${n}`} onClick={() => setAjustandoChave(foto.chave)}>
                      Ajustar
                    </button>
                    <button type="button" className={styles.excluir} aria-label={`Excluir a foto ${n}`} onClick={() => excluir(i)}>
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {ajustando && (
        <div className={styles.ajuste}>
          <p className={styles.ajusteTitulo}>Enquadramento da foto {fotos.indexOf(ajustando) + 1}</p>
          <SeletorFoco
            src={ajustando.url}
            alt={ajustando.alt || nomeProduto || 'Foto do produto'}
            x={ajustando.foco_x}
            y={ajustando.foco_y}
            zoom={ajustando.zoom}
            onChange={({ x, y, zoom }) => atualizar(ajustando.chave, { foco_x: x, foco_y: y, zoom })}
          />
        </div>
      )}

      <p className={styles.ajuda}>Excluir e reordenar só valem ao clicar em Salvar; a foto excluída é apagada do armazenamento.</p>
    </div>
  );
}
