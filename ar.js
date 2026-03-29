// ══ FASES DA EXPERIÊNCIA ══

const PHASES = [
  { start:   0, end:  10, label: '',                                                  mode: 'idle'   },
  { start:  10, end:  43, label: 'Encontre um local confortável\ne esteja presente.', mode: 'gentle' },
  { start:  43, end: 108, label: 'Inspire profundamente…\nExale lentamente…',          mode: 'breath' },
  { start: 108, end: 161, label: 'Sinta a textura.\nO aroma que ele exhala.',          mode: 'aroma'  },
  { start: 161, end: 233, label: 'Laranja · Cardamomo · Cacau\nEnergia e vitalidade.', mode: 'warm'   },
  { start: 233, end: 266, label: 'Seco ao sol,\nabsorvendo a energia divina.',         mode: 'solar'  },
  { start: 266, end: 322, label: 'Sinta a alegria crescendo,\nirradiando ao seu redor.', mode: 'burst' },
];

// ══ MODOS VISUAIS ══

// Apenas a opacidade das partículas varia por fase
const MODES = {
  idle:   { p: 0.00 },
  gentle: { p: 0.22 },
  breath: { p: 0.28 },
  aroma:  { p: 0.42 },
  warm:   { p: 0.58 },
  solar:  { p: 0.55 },
  burst:  { p: 0.85 },
};

// ══ PALAVRAS 3D ══

const WORDS = [
  {
    text:    'INSPIRE',
    start:   43,
    end:     108,
    fadeIn:  1.5,
    fadeOut: 2.0,
    size:    0.18,
    color:   0xF5EDD8,
    y:       0.0,
    z:       -3.0,
  },
];

// ══ RENDERER E CENA ══

const canvas3D = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3D, alpha: true, antialias: true });
renderer.xr.enabled = true;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0, 0);
renderer.setSize(innerWidth, innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 200);

// Iluminação ambiente e direcional
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xFFE8C0, 1.2);
dirLight.position.set(0, 3, -3);
scene.add(dirLight);

// Redimensionamento — ignora quando XR está ativo
window.addEventListener('resize', () => {
  if (renderer.xr.isPresenting) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ══ PARTÍCULAS ══

const PARTICLE_COUNT = 2000;

// Paleta de cores: dourado, âmbar, creme, dourado claro, terracota
const PARTICLE_PALETTE = [
  new THREE.Color(0xD4A843),
  new THREE.Color(0xE8922A),
  new THREE.Color(0xF5EDD8),
  new THREE.Color(0xF0C060),
  new THREE.Color(0xC0622A),
];

const pPositions = new Float32Array(PARTICLE_COUNT * 3);
const pColors    = new Float32Array(PARTICLE_COUNT * 3);
const pSizes     = new Float32Array(PARTICLE_COUNT);
const pVelocity  = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  // Posição esférica aleatória
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = 2 + Math.random() * 6;

  pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  pPositions[i * 3 + 1] = 0.5 + Math.random() * 2.5; // entre 0.5m e 3m do chão (local-floor)
  pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

  // Cor aleatória da paleta
  const col = PARTICLE_PALETTE[Math.floor(Math.random() * PARTICLE_PALETTE.length)];
  pColors[i * 3]     = col.r;
  pColors[i * 3 + 1] = col.g;
  pColors[i * 3 + 2] = col.b;

  // Tamanho
  pSizes[i] = 4 + Math.random() * 18;

  // Velocidade: ascensão suave com deriva lateral aleatória
  pVelocity[i * 3]     = (Math.random() - 0.5) * 0.002;
  pVelocity[i * 3 + 1] = 0.001 + Math.random() * 0.003;
  pVelocity[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
particleGeo.setAttribute('color',    new THREE.BufferAttribute(pColors,    3));
particleGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes,     1));

const particleMat = new THREE.ShaderMaterial({
  uniforms: {
    op: { value: 0.0 },
  },
  vertexShader: /* glsl */`
    attribute float size;
    attribute vec3 color;
    varying vec3 vC;
    varying float vFade;

    void main() {
      vC = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      // Fade gradual baseado na distância
      vFade = clamp(1.0 - length(mv.xyz) / 18.0, 0.0, 1.0);
      // Tamanho com perspectiva
      gl_PointSize = size * (200.0 / -mv.z);
      gl_Position  = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */`
    uniform float op;
    varying vec3 vC;
    varying float vFade;

    void main() {
      // Círculo suave — descarta os cantos do quad
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float alpha = pow(1.0 - d * 2.0, 2.0);
      gl_FragColor = vec4(vC, alpha * op * vFade);
    }
  `,
  transparent:  true,
  depthWrite:   false,
  blending:     THREE.AdditiveBlending,
  vertexColors: true,
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ── DIAGNÓSTICO — esfera vermelha a 2m à frente, altura dos olhos ──
// Remover após confirmar que a cena está renderizando corretamente
const diagMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
diagMesh.position.set(0, 1.4, -2);
scene.add(diagMesh);

// ══ SISTEMA DE PALAVRAS 3D ══

let font             = null;
let wordMeshes       = []; // array de { mat, def, opacity }
let wordAnchorDone   = false;
let pendingAnchorPos = null;
let pendingAnchorQ   = null;

// Pré-carrega a fonte ao abrir a página
new THREE.FontLoader().load(
  'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
  loaded => {
    font = loaded;
    // Se a âncora já foi capturada antes da fonte carregar, constrói agora
    if (pendingAnchorPos) buildWords(pendingAnchorPos, pendingAnchorQ);
  }
);

/**
 * Constrói as malhas de texto 3D ancoradas na posição frontal inicial.
 * @param {THREE.Vector3} anchorPos - posição da câmera no momento da captura
 * @param {THREE.Quaternion} anchorQ - rotação de yaw da câmera
 */
function buildWords(anchorPos, anchorQ) {
  pendingAnchorPos = null;

  // Grupo âncora posicionado na direção frontal do usuário no início da sessão
  const anchor = new THREE.Group();
  anchor.position.set(anchorPos.x, 0, anchorPos.z);
  anchor.quaternion.copy(anchorQ);
  scene.add(anchor);

  for (const def of WORDS) {
    const geo = new THREE.TextGeometry(def.text, {
      font:          font,
      size:          def.size,
      height:        def.size * 0.05,
      bevelEnabled:  false,
      curveSegments: 12,
    });

    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const cx = -(bb.max.x + bb.min.x) / 2; // centraliza horizontalmente

    const mat = new THREE.MeshStandardMaterial({
      color:       def.color,
      transparent: true,
      opacity:     0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, 1.4 + def.y, def.z);
    anchor.add(mesh);

    wordMeshes.push({ mat, def, opacity: 0 });
  }
}

/**
 * Captura a orientação frontal da câmera XR para ancorar os textos.
 * Chamada uma única vez, após o frame XR atualizar a pose da câmera.
 */
function captureWordAnchor() {
  if (wordAnchorDone) return;
  wordAnchorDone = true;

  // Extrai apenas o yaw (rotação horizontal) para manter o texto vertical
  const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  const yawQ  = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0));

  if (font) {
    buildWords(camera.position, yawQ);
  } else {
    // Fonte ainda não carregou — guarda para construir assim que chegar
    pendingAnchorPos = camera.position.clone();
    pendingAnchorQ   = yawQ.clone();
  }
}

// ══ CONTROLE DE FASES ══

let currentMode = 'idle';
let targetOp    = 0;
let currentOp   = 0;
let _audioTime  = 0;

// Referências DOM
const phaseLabel    = document.getElementById('phase-label');
const audioBar      = document.getElementById('audio-bar');
const audioProgress = document.getElementById('audio-progress');

/**
 * Verifica em qual fase o áudio está e atualiza o modo visual e o texto da fase.
 * @param {number} t - tempo atual do áudio em segundos
 */
function checkPhase(t) {
  for (const phase of PHASES) {
    if (t >= phase.start && t < phase.end) {
      if (currentMode !== phase.mode) {
        currentMode = phase.mode;
        if (phaseLabel) {
          if (phase.label) {
            phaseLabel.textContent = phase.label;
            phaseLabel.classList.add('visible');
          } else {
            phaseLabel.classList.remove('visible');
          }
        }
      }
      return;
    }
  }
}

// ══ LOOP DE ANIMAÇÃO ══

let lastTime     = 0;
let xrFrameCount = 0;

function animate(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Interpola a opacidade das partículas suavemente conforme a fase
  targetOp   = (MODES[currentMode] ?? MODES.idle).p;
  currentOp += (targetOp - currentOp) * Math.min(dt * 1.2, 1);
  particleMat.uniforms.op.value = currentOp;

  // Move partículas — ascensão suave, reposiciona ao ultrapassar o teto
  const pos = particleGeo.attributes.position;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos.array[i * 3]     += pVelocity[i * 3];
    pos.array[i * 3 + 1] += pVelocity[i * 3 + 1];
    pos.array[i * 3 + 2] += pVelocity[i * 3 + 2];
    if (pos.array[i * 3 + 1] > 9) pos.array[i * 3 + 1] -= 10;
  }
  pos.needsUpdate = true;

  // Renderiza — isso atualiza a pose da câmera via XR
  renderer.render(scene, camera);

  // Captura a âncora frontal após a câmera ser atualizada pelo XR
  if (renderer.xr.isPresenting) {
    xrFrameCount++;
    if (xrFrameCount === 4) captureWordAnchor();
  }

  // Atualiza opacidade de cada palavra com fade in/out baseado no tempo do áudio
  const t = _audioTime;
  for (const w of wordMeshes) {
    const { def, mat } = w;
    let target = 0;

    if (t >= def.start && t < def.end) {
      const fi = Math.min((t - def.start) / def.fadeIn,  1);
      const fo = Math.min((def.end - t)   / def.fadeOut, 1);
      target = Math.min(fi, fo);
    }

    w.opacity += (target - w.opacity) * Math.min(dt * 3, 1);
    mat.opacity = w.opacity;
  }
}

// ══ INICIALIZAÇÃO DA SESSÃO XR ══

const arLaunchBtn = document.getElementById('ar-launch-play');
const arBack      = document.getElementById('ar-back');

if (arLaunchBtn) {
  arLaunchBtn.addEventListener('click', async () => {
    let session;

    // Solicita sessão WebXR imersiva com âncora no piso
    try {
      session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
      });
    } catch (err) {
      console.error('WebXR requestSession failed:', err);
      return;
    }

    await renderer.xr.setSession(session);
    renderer.setAnimationLoop(animate);

    // Oculta a tela de lançamento com transição suave
    const arLaunch = document.getElementById('ar-launch');
    arLaunch.classList.remove('visible');
    setTimeout(() => { arLaunch.style.display = 'none'; }, 1300);

    // Exibe botão de voltar e barra de progresso do áudio
    if (arBack)   arBack.classList.add('visible');
    if (audioBar) audioBar.classList.add('visible');

    // Inicia o áudio da meditação
    const audio = document.getElementById('audio');
    if (audio) {
      audio.play().catch(() => audio.play());

      // Atualiza tempo, barra de progresso e fase a cada tick do áudio
      audio.addEventListener('timeupdate', () => {
        _audioTime = audio.currentTime;

        if (audioProgress && audio.duration) {
          audioProgress.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
        }

        checkPhase(audio.currentTime);
      });

      // Ao terminar o áudio — encerra a experiência e exibe tela final
      audio.addEventListener('ended', () => {
        currentMode = 'idle';

        if (phaseLabel) phaseLabel.classList.remove('visible');
        if (audioBar)   audioBar.classList.remove('visible');

        renderer.setAnimationLoop(null);
        session.end().catch(() => {});

        setTimeout(() => {
          const endScreen = document.getElementById('end-screen');
          if (endScreen) endScreen.classList.add('visible');
        }, 1500);
      });
    }

    // Ao encerrar a sessão XR (pelo sistema ou pelo fim do áudio)
    session.addEventListener('end', () => {
      renderer.setAnimationLoop(null);
    });
  });
}
