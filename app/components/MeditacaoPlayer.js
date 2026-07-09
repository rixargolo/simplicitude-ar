'use client';

import { useState } from 'react';
import styles from './MeditacaoPlayer.module.css';

// Adapta o botão "APENAS MEDITAÇÃO" (.btn-audio) da tela de boas-vindas do
// antigo app AR: em vez de navegar para outra tela, revela o player HTML5
// nativo no lugar.
export default function MeditacaoPlayer({ audioUrl }) {
  const [aberto, setAberto] = useState(false);

  if (!audioUrl) {
    return <p className={styles.emBreve}>Meditação guiada em breve</p>;
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className={styles.btnAudio}
        onClick={() => setAberto(true)}
      >
        ♪ &nbsp;Deguste ouvindo a meditação guiada na voz de Bruna Santos
        <span className={styles.btnSub}>áudio guiado · toque para ouvir</span>
      </button>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio className={styles.player} src={audioUrl} controls autoPlay />
  );
}
