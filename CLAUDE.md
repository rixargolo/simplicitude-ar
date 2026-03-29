# Simplicitude AR — Experiência Alegria

## O projeto

Experiência de realidade aumentada para a **Simplicitude**, marca brasileira
de chocolate artesanal com filosofia "Da Floresta à Fábrica". O projeto é um
MVP focado no chocolate **Alegria**, parte da coleção **Inspirar** — três
chocolates com meditações guiadas em áudio, narradas por Bruna Santos.

O objetivo é impressionar a dona da fábrica com uma demo que ela possa abrir
sozinha no celular, sem instalar nenhum app — apenas um link.

Site em produção: **https://simplicitude-ar.netlify.app**
Repositório: GitHub pessoal (rixargolo) + deploy via Netlify

---

## Stack

- **Three.js r128** via CDN clássico (não ES modules)
- **WebXR** (`immersive-ar` + `local-floor`) — AR real com rastreamento ARCore
- **Web Audio API** — sincronização de visuais com fases do áudio
- Sem frameworks. Sem app. HTML/JS puro deployado via Netlify.

---

## Modos de experiência

A tela de boas-vindas detecta suporte a WebXR e adapta os botões:

- **Android Chrome (WebXR disponível)** → exibe dois botões: "Experiência AR"
  e "Apenas Meditação"
- **iOS Safari / Desktop / sem WebXR** → exibe apenas "Apenas Meditação" com
  nota discreta: *"Experiência AR disponível no Chrome para Android"*

A detecção usa `navigator.xr?.isSessionSupported('immersive-ar')` após o
carregamento da página. Os dois botões existem no HTML — o botão AR é
ocultado via JS quando WebXR não está disponível.

### Player de áudio (modo só-meditação)

Player HTML5 customizado, sem bibliotecas externas. Usa o mesmo elemento
`<audio>` do modo AR. Design on-brand: fundo escuro, tipografia Cinzel, barra
de progresso dourada (`--gold: #D4A843`). Controles: play/pause, barra de
progresso clicável, tempo decorrido/total. Fullscreen — mesma filosofia
imersiva do modo AR.

---

## Arquitetura da cena AR

### Sessão WebXR

A sessão é iniciada com `navigator.xr.requestSession('immersive-ar', {
requiredFeatures: ['local-floor'] })`. O renderer Three.js tem `xr.enabled =
true`. A câmera é controlada inteiramente pelo WebXR — sem giroscópio manual,
sem DeviceOrientation.

### Elementos da cena

- **Partículas** — 2000 pontos dourados/âmbar fixos no world space (ancorados
  no mundo real, não seguem o usuário). Espalhadas em esfera de raio 2–8m ao
  redor da origem da sessão. Shader customizado com AdditiveBlending e fade
  por distância. Opacidade global controlada por fase (`MODES.p`).

### Texto 3D

Palavras renderizadas como `TextGeometry` (sem bevel, `curveSegments: 12`),
ancoradas na direção frontal do usuário no momento em que a sessão inicia.
Fonte: `helvetiker_bold` via CDN do Three.js.

Controladas pelo array `WORDS` no topo de `ar.js` — editável manualmente:
```js
const WORDS = [
  {
    text:    'INSPIRE',
    start:   43,      // segundo do áudio — início do fade in
    end:     108,     // segundo do áudio — fim do fade out
    fadeIn:  1.5,     // duração do fade in (segundos)
    fadeOut: 2.0,     // duração do fade out (segundos)
    size:    0.18,    // tamanho da fonte em metros
    color:   0xF5EDD8,
    y:       0.0,     // offset vertical em metros (0 = altura dos olhos)
    z:       -3.0,    // distância à frente em metros
  },
];
```

---

## Fases do áudio

A experiência é dividida em 7 fases por timestamps do áudio:

`idle` → `gentle` → `breath` → `aroma` → `warm` → `solar` → `burst`

Cada fase define a opacidade alvo das partículas (`MODES.p`) e o texto do
HUD (`PHASES.label`).

---

## Estrutura de arquivos

- `index.html` — markup, tela de boas-vindas, player de áudio, HUD
- `ar.js` — toda a lógica WebXR, partículas, palavras 3D, fases
- `style.css` — estilos globais, tokens de cor da marca, player, telas
- `audio/alegria.mp3` — áudio da meditação
- `images/` — assets de imagem da tela de boas-vindas

---

## Princípios do projeto

- **Imersão primeiro** — a experiência deve parecer uma janela para outro
  mundo, não um app
- **Zero instalação** — funciona direto no browser móvel, apenas um link
- **Nenhum rastreamento por imagem** — embalagem não é âncora
- **Nenhuma integração com QR code existente** — preservar o elemento surpresa

---

## O que NÃO fazer

- Não usar giroscópio/DeviceOrientation — a câmera é controlada pelo WebXR
- Não ancorar elementos à câmera (exceto se explicitamente indicado)
- Não adicionar UI desnecessária
- Não usar SoundCloud embed nem player externo — o MP3 está no projeto
- Não fazer o player de áudio parecer um fallback — é uma experiência própria
- Não usar ES modules ou importmap — o projeto usa CDN clássico do Three.js

---

## Próximos passos planejados (não implementar ainda)

- Indicador sutil na borda da tela quando o conteúdo principal sair do campo
  de visão
- Mais elementos visuais distribuídos no espaço 360° ao longo da experiência
- Evolução do texto 3D: animações mais ricas, modelos mais complexos
- Expansão para os outros dois chocolates: Esperança e Serenidade