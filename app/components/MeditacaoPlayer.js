'use client';

import { useState } from 'react';
import styles from './MeditacaoPlayer.module.css';
import pt from '@/lib/i18n/pt';

// Adapta o botão "APENAS MEDITAÇÃO" (.btn-audio) da tela de boas-vindas do
// antigo app AR: em vez de navegar para outra tela, revela o player HTML5
// nativo no lugar.
// `textos` = dicionário `player` do idioma da página (padrão PT). `avisoPt`: o áudio que vai tocar é o PT numa
// página EN (sem áudio EN cadastrado); mostra `textos.avisoPt` junto do player (ADR 0002, §4).
export default function MeditacaoPlayer({ audioUrl, textos = pt.player, avisoPt = false }) {
  const [aberto, setAberto] = useState(false);

  if (!audioUrl) {
    return <p className={styles.emBreve}>{textos.emBreve}</p>;
  }

  return (
    <>
      {aberto ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio className={styles.player} src={audioUrl} controls autoPlay />
      ) : (
        <button type="button" className={styles.btnAudio} onClick={() => setAberto(true)}>
          ♪ &nbsp;{textos.botao}
          <span className={styles.btnSub}>{textos.sub}</span>
        </button>
      )}
      {avisoPt && <p className={styles.emBreve}>{textos.avisoPt}</p>}
    </>
  );
}
