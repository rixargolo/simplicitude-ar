# Simplicitude AR — Experiência Alegria

## O projeto

Experiência de realidade aumentada para a **Simplicitude**, marca brasileira de chocolate artesanal com filosofia "Da Floresta à Fábrica". O projeto é um MVP focado no chocolate **Alegria**, parte da coleção **Inspirar** — três chocolates com meditações guiadas em áudio, narradas por Bruna Santos.

O objetivo é impressionar a dona da fábrica com uma demo que ela possa abrir sozinha no celular, sem instalar nenhum app — apenas um link.

Site em produção: **https://simplicitude-ar.netlify.app**
Repositório: GitHub pessoal (rixargolo) + deploy via Netlify

---

## Stack

- **Three.js** — cena 3D completa
- **DeviceOrientation API** — câmera livre orientada pelo giroscópio (360°)
- **Web Audio API** — sincronização de animações com fases do áudio
- Sem frameworks. Sem app. HTML/JS puro deployado via Netlify.

---

## Arquitetura da cena

### Câmera e giroscópio

A câmera é orientada pelo `deviceorientation` do celular — movimento livre em 360°. O usuário segura o celular como uma janela para o ambiente.

- Todos os elementos são **ancorados no espaço do mundo** (world space), não na câmera
- O centro da cena (frente inicial) é definido no momento em que o usuário abre a experiência
- O texto principal é posicionado nesse ponto frontal

### Elementos da cena

Todos fixos no world space, visíveis conforme o usuário orienta o celular:

- **Sol** com efeito sunburst
- **Partículas** com blending aditivo
- **Anéis torus** em rotação
- **Esferas** em órbita

### Texto 3D

**"INSPIRE"** aparece em 3D, ancorado à frente inicial da cena.

Comportamento na fase `breath`:
- Pulsa em escala e opacidade sincronizado com o ritmo de inspirar/expirar
- Fade in suave ao entrar na fase, fade out ao sair
- Tamanho grande — protagonismo visual, não elemento secundário

Direções futuras de texto (não implementar agora):
- Palavras emergindo de profundidade (vêm até o usuário)
- Texto formado por partículas
- Palavras em posições diferentes da cena (descoberta ao girar)

---

## Fases do áudio

A experiência é dividida em 7 fases, identificadas por timestamps:

`idle` → `gentle` → `breath` → `aroma` → `warm` → `solar` → `burst`

Cada fase tem comportamento visual distinto. O texto "INSPIRE" é exclusivo da fase `breath`.

---

## Princípios do projeto

- **Imersão primeiro** — uma implementação tecnicamente funcional mas visualmente plana já foi rejeitada em favor de uma experiência mais impactante
- **Nenhum rastreamento por imagem** — a embalagem foi considerada genérica demais para ser âncora
- **Nenhuma integração com o QR code existente** — para preservar o elemento surpresa
- **Zero instalação** — funciona direto no browser do celular (iOS e Android)

---

## O que NÃO fazer

- Não usar `OrbitControls` ou qualquer controle de câmera baseado em toque/mouse — a orientação é exclusivamente por giroscópio
- Não ancorar elementos à câmera (exceto se explicitamente indicado no futuro)
- Não adicionar UI desnecessária — a experiência deve parecer uma janela para outro mundo, não um app

---

## Próximos passos planejados (não implementar ainda)

- Indicador sutil na borda da tela quando o conteúdo principal sair do campo de visão
- Mais elementos distribuídos no espaço 360° à medida que a experiência evolui
- Expansão para os outros dois chocolates: Esperança e Serenidade