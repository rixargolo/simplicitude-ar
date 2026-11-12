'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify, slugDoEndereco, slugValido } from '@/lib/produtos';
import CampoSlug from '../CampoSlug';
import { caminhoDaUrl, validarArquivos } from '@/lib/fotos';
import { FOCO_PADRAO, ZOOM_PADRAO } from '@/lib/foco';
import SeletorFoco from '../produtos/SeletorFoco';
import TraducaoEn, { salvarTraducao, traducaoEnInicial } from '../TraducaoEn';
import styles from './CategoriaForm.module.css';

const BUCKET = 'categorias'; // bucket próprio (X7), criado no SQL da migration
const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default function CategoriaForm({ mode, categoria }) {
  const router = useRouter();

  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [slug, setSlug] = useState(categoria?.slug ?? '');
  const [descricao, setDescricao] = useState(categoria?.descricao ?? '');
  // Foto (X7): { url, arquivo?, x, y, zoom } ou null. `arquivo` só existe para foto ainda não enviada.
  const [foto, setFoto] = useState(
    categoria?.imagem_url
      ? {
          url: categoria.imagem_url,
          x: categoria.imagem_foco_x ?? FOCO_PADRAO,
          y: categoria.imagem_foco_y ?? FOCO_PADRAO,
          zoom: categoria.imagem_zoom ?? ZOOM_PADRAO,
        }
      : null,
  );
  const [en, setEn] = useState(() => traducaoEnInicial(categoria?.categoria_traducoes));
  const existiaEn = Boolean(categoria?.categoria_traducoes?.some((t) => t.idioma === 'en'));
  const [idCriado, setIdCriado] = useState(null); // criada, mas a foto falhou: o próximo Salvar atualiza em vez de inserir
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function escolherFoto(event) {
    const [arquivo] = event.target.files;
    event.target.value = '';
    if (!arquivo) return;
    const { aceitos, erros } = validarArquivos([arquivo]);
    if (erros.length > 0) {
      setErro(erros[0]);
      return;
    }
    setErro('');
    if (foto?.arquivo) URL.revokeObjectURL(foto.url);
    setFoto({ url: URL.createObjectURL(aceitos[0]), arquivo: aceitos[0], x: FOCO_PADRAO, y: FOCO_PADRAO, zoom: ZOOM_PADRAO });
  }

  function removerFoto() {
    if (foto?.arquivo) URL.revokeObjectURL(foto.url);
    setFoto(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome da categoria.');
      return;
    }

    const slugFinal = slug.trim() ? slugDoEndereco(slug, 'categoria') : slugify(nome);
    if (!slugValido(slugFinal)) {
      setErro('Endereço inválido: use só a parte final, com letras minúsculas sem acento, números e hífen (até 80 caracteres).');
      return;
    }

    setSalvando(true);
    const supabase = createClient();

    const payload = {
      nome: nome.trim(),
      slug: slugFinal,
      descricao: descricao.trim() || null,
    };

    try {
      let id = categoria?.id ?? idCriado;
      if (id) {
        await atualizarCategoria(supabase, id, payload);
      } else {
        id = await criarCategoria(supabase, payload);
        setIdCriado(id);
      }

      await salvarFoto(supabase, id, foto, categoria);
      await salvarTraducao(supabase, 'categoria_traducoes', 'categoria_id', id, en, existiaEn);

      router.push('/admin/categorias');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro(
        err.code === '23505'
          ? 'Já existe uma categoria com esse endereço.'
          : err.exibir
            ? err.message
            : 'Não foi possível salvar a categoria. Tente novamente.',
      );
      setSalvando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>
        {mode === 'create' ? 'Nova categoria' : `Editar — ${categoria.nome}`}
      </h1>

      <label className={styles.field}>
        <span className={styles.label}>Nome</span>
        <input
          className={styles.input}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </label>

      <CampoSlug
        id="categoria-slug"
        tipo="categoria"
        value={slug}
        onChange={setSlug}
        sugestao={slugify(nome)}
        avisoEdicao={
          mode === 'edit' &&
          `Atenção: mudar o endereço faz os links antigos (?categoria=${categoria.slug}) mostrarem a loja inteira em vez desta categoria. Não há redirecionamento.`
        }
      />

      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <textarea
          className={styles.textarea}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
        />
      </label>

      <div className={styles.field}>
        <label htmlFor="categoria-foto" className={styles.label}>Foto (opcional)</label>
        <input
          id="categoria-foto"
          className={styles.input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={escolherFoto}
          aria-describedby="categoria-foto-ajuda"
        />
        <span id="categoria-foto-ajuda" className={styles.ajuda}>
          Aparece no topo do cartão da categoria na página inicial. JPEG, PNG ou WebP, até 5 MB.
        </span>
        {foto && (
          <>
            {/* o cartão da home usa faixa 16:9: a prévia do seletor segue a mesma proporção */}
            <div style={{ '--proporcao-produto': '16 / 9' }}>
              <SeletorFoco
                src={foto.url}
                alt="Foto da categoria"
                x={foto.x}
                y={foto.y}
                zoom={foto.zoom}
                onChange={({ x, y, zoom }) => setFoto({ ...foto, x, y, zoom })}
              />
            </div>
            <button type="button" className={styles.remover} onClick={removerFoto}>
              Remover foto
            </button>
          </>
        )}
      </div>

      <TraducaoEn valores={en} onChange={setEn} />

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.actions}>
        <button className={styles.cta} type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// Insere a categoria e devolve o id.
async function criarCategoria(supabase, payload) {
  const { data, error } = await supabase.from('categorias').insert(payload).select('id').single();
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data.id;
}

// Grava a foto da categoria (X7), em ordem segura (nunca apontar para arquivo apagado):
// 1) envia o arquivo novo; 2) grava imagem_url + enquadramento (se falhar, apaga o enviado);
// 3) só então remove do Storage o arquivo antigo. Sem foto antes nem agora, não toca no banco
// (assim salvar categoria continua funcionando antes do SQL do X7 ser aplicado).
async function salvarFoto(supabase, id, foto, categoria) {
  if (!foto && !categoria?.imagem_url) return;

  let enviado = null;
  let url = foto?.url ?? null;
  if (foto?.arquivo) {
    enviado = `${id}/${crypto.randomUUID()}.${EXTENSAO[foto.arquivo.type]}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(enviado, foto.arquivo, { cacheControl: '31536000' }); // nome único: cache longo é seguro
    if (error) throw erroDaFoto(`Categoria salva, mas o envio da foto falhou: ${error.message}`);
    url = supabase.storage.from(BUCKET).getPublicUrl(enviado).data.publicUrl;
  }

  const { error } = await supabase
    .from('categorias')
    .update({
      imagem_url: url,
      imagem_foco_x: foto?.x ?? FOCO_PADRAO,
      imagem_foco_y: foto?.y ?? FOCO_PADRAO,
      imagem_zoom: foto?.zoom ?? ZOOM_PADRAO,
    })
    .eq('id', id);
  if (error) {
    if (enviado) await supabase.storage.from(BUCKET).remove([enviado]);
    throw erroDaFoto(`Categoria salva, mas não foi possível gravar a foto: ${error.message}`);
  }

  const antigo = caminhoDaUrl(categoria?.imagem_url, BUCKET);
  if (antigo && url !== categoria.imagem_url) {
    const { error: erroRemocao } = await supabase.storage.from(BUCKET).remove([antigo]);
    if (erroRemocao) console.error('Foto antiga continua no Storage:', erroRemocao.message);
  }
}

const erroDaFoto = (mensagem) => Object.assign(new Error(mensagem), { exibir: true });

// Atualiza os campos de uma categoria existente.
async function atualizarCategoria(supabase, id, payload) {
  const { error } = await supabase
    .from('categorias')
    .update(payload)
    .eq('id', id);

  if (error) throw Object.assign(new Error(error.message), { code: error.code });
}
