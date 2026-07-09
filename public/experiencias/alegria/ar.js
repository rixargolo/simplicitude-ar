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

const MODES = {
  idle:   { p: 0.10 },
  gentle: { p: 0.22 },
  breath: { p: 0.28 },
  aroma:  { p: 0.42 },
  warm:   { p: 0.58 },
  solar:  { p: 0.55 },
  burst:  { p: 0.85 },
};

// ══ CONFIGURAÇÃO DAS PALAVRAS 3D ══

const WORD_SIZE  = 0.18;  // metros
const WORD_COLOR = 0xF5EDD8;
const WORD_Z     = -1.5;  // distância à frente (espaço local da câmera)

// Duração de cada fase do ciclo de respiração (segundos)
// 0=inspire-in  1=inspire-hold  2=inspire-out  3=expire-in  4=expire-shrink  5=gap
const CYCLE_DUR = [3.5, 2.0, 0.8, 0.8, 4.0, 0.4];

// ══ RENDERER E CENA ══

const canvas3D = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3D, alpha: true, antialias: true });
renderer.xr.enabled = true;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0, 0);
renderer.setSize(innerWidth, innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 200);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xFFE8C0, 1.2);
dirLight.position.set(0, 3, -3);
scene.add(dirLight);

window.addEventListener('resize', () => {
  if (renderer.xr.isPresenting) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ══ PARTÍCULAS ══

const PARTICLE_COUNT = 2000;

const PARTICLE_PALETTE = [
  new THREE.Color(0xD4A843),
  new THREE.Color(0xE8922A),
  new THREE.Color(0xF5EDD8),
  new THREE.Color(0xF0C060),
  new THREE.Color(0xC0622A),
];

const pPositions = new Float32Array(PARTICLE_COUNT * 3);
const pColors    = new Float32Array(PARTICLE_COUNT * 3);
const pVelocity  = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = 2 + Math.random() * 6;

  pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  pPositions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
  pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

  const col = PARTICLE_PALETTE[Math.floor(Math.random() * PARTICLE_PALETTE.length)];
  pColors[i * 3]     = col.r;
  pColors[i * 3 + 1] = col.g;
  pColors[i * 3 + 2] = col.b;

  pVelocity[i * 3]     = (Math.random() - 0.5) * 0.002;
  pVelocity[i * 3 + 1] = 0.001 + Math.random() * 0.003;
  pVelocity[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
particleGeo.setAttribute('color',    new THREE.BufferAttribute(pColors,    3));

// Textura circular com soft glow — partículas redondas, não quadradas
function makeCircleTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0,   'rgba(255,255,255,1.0)');
  g.addColorStop(0.35,'rgba(255,255,255,0.7)');
  g.addColorStop(1,   'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const particleMat = new THREE.PointsMaterial({
  size:            0.10,
  sizeAttenuation: true,
  vertexColors:    true,
  transparent:     true,
  opacity:         0.85,
  depthWrite:      false,
  blending:        THREE.AdditiveBlending,
  map:             makeCircleTex(),
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ══ SISTEMA DE PALAVRAS 3D (segue o olhar — câmera) ══

let font        = null;
let wordAnchor  = null; // Group que segue a câmera a cada frame
let breathMeshes = null; // { inspire: { group, mat }, expire: { group, mat } }
let fontReady    = false;
let sessionReady = false;

// Vetores pré-alocados para o loop de animação (sem GC)
const _camFwd = new THREE.Vector3();

// Carrega a fonte ao abrir a página
new THREE.FontLoader().load(
  'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
  loaded => {
    font = loaded;
    fontReady = true;
    if (sessionReady && !breathMeshes) buildWords();
  }
);

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Constrói as malhas INSPIRE e EXPIRE.
 * Não depende de posição — o wordAnchor segue a câmera a cada frame.
 */
function buildWords() {
  wordAnchor = new THREE.Group();
  scene.add(wordAnchor);

  function makeWordMesh(text) {
    const geo = new THREE.TextGeometry(text, {
      font,
      size:          WORD_SIZE,
      height:        WORD_SIZE * 0.05,
      bevelEnabled:  false,
      curveSegments: 12,
    });
    geo.computeBoundingBox();
    const cx = -(geo.boundingBox.max.x + geo.boundingBox.min.x) / 2;

    const mat = new THREE.MeshStandardMaterial({
      color:       WORD_COLOR,
      transparent: true,
      opacity:     0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, 0, 0); // centralizado dentro do grupo-pivot

    // Grupo-pivot: permite escalar ao redor do centro do texto
    const group = new THREE.Group();
    group.add(mesh);
    wordAnchor.add(group);

    return { group, mat };
  }

  breathMeshes = {
    inspire: makeWordMesh('INSPIRE'),
    expire:  makeWordMesh('EXPIRE'),
  };
}

// ══ CONTROLE DE FASES ══

let currentMode  = 'idle';
let currentOp    = 0;
let _audioTime   = 0;

let cyclePhase   = 0;
let cycleElapsed = 0;
let cycleActive  = false;

const phaseLabel    = document.getElementById('phase-label');
const audioBar      = document.getElementById('audio-bar');
const audioProgress = document.getElementById('audio-progress');

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

let lastTime = 0;

function animate(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Opacidade das partículas conforme a fase
  currentOp = (MODES[currentMode] ?? MODES.idle).p;
  particleMat.opacity = currentOp;

  // Movimento suave das partículas
  const pos = particleGeo.attributes.position;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos.array[i * 3]     += pVelocity[i * 3];
    pos.array[i * 3 + 1] += pVelocity[i * 3 + 1];
    pos.array[i * 3 + 2] += pVelocity[i * 3 + 2];
    if (pos.array[i * 3 + 1] > 9) pos.array[i * 3 + 1] -= 10;
  }
  pos.needsUpdate = true;

  // Renderiza — XR atualiza a pose da câmera durante o render
  renderer.render(scene, camera);

  // ── Âncora das palavras segue o olhar da câmera ──
  // (após renderer.render para usar a pose XR do frame atual)
  if (wordAnchor) {
    _camFwd.set(0, 0, WORD_Z).applyQuaternion(camera.quaternion);
    wordAnchor.position.copy(camera.position).add(_camFwd);
    wordAnchor.quaternion.copy(camera.quaternion);
  }

  // ── Ciclo INSPIRE / EXPIRE ──
  if (breathMeshes) {
    const { inspire, expire } = breathMeshes;

    if (!cycleActive && _audioTime >= 43) {
      cycleActive  = true;
      cyclePhase   = 0;
      cycleElapsed = 0;
    }

    if (cycleActive) {
      cycleElapsed += dt;

      // Avança fase(s) se o tempo esgotou
      while (cycleElapsed >= CYCLE_DUR[cyclePhase]) {
        cycleElapsed -= CYCLE_DUR[cyclePhase];
        cyclePhase    = (cyclePhase + 1) % CYCLE_DUR.length;
      }

      const p = easeInOut(cycleElapsed / CYCLE_DUR[cyclePhase]);

      // Limpa defaults
      inspire.mat.opacity = 0;
      expire.mat.opacity  = 0;
      inspire.group.scale.setScalar(1);
      expire.group.scale.setScalar(1);

      switch (cyclePhase) {
        case 0: // INSPIRE aparece crescendo (inhale)
          inspire.mat.opacity = p;
          inspire.group.scale.setScalar(0.5 + 0.5 * p);
          break;
        case 1: // INSPIRE segura
          inspire.mat.opacity = 1;
          break;
        case 2: // INSPIRE some em fade
          inspire.mat.opacity = 1 - p;
          break;
        case 3: // EXPIRE aparece no tamanho pleno
          expire.mat.opacity = p;
          break;
        case 4: // EXPIRE diminui e some (exhale)
          expire.mat.opacity = 1 - p;
          expire.group.scale.setScalar(Math.max(0.01, 1 - p));
          break;
        case 5: // pausa breve
          break;
      }
    } else {
      inspire.mat.opacity = 0;
      expire.mat.opacity  = 0;
    }
  }
}

// ══ INICIALIZAÇÃO DA SESSÃO XR ══

const arLaunchBtn = document.getElementById('ar-launch-play');
const arBack      = document.getElementById('ar-back');

if (arLaunchBtn) {
  arLaunchBtn.addEventListener('click', async () => {
    const audio = document.getElementById('audio');

    // Registra listeners antes de qualquer await
    if (audio) {
      audio.addEventListener('timeupdate', () => {
        _audioTime = audio.currentTime;
        if (audioProgress && audio.duration) {
          audioProgress.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
        }
        checkPhase(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        currentMode = 'idle';
        cycleActive = false;
        if (phaseLabel) phaseLabel.classList.remove('visible');
        if (audioBar)   audioBar.classList.remove('visible');
        renderer.setAnimationLoop(null);
        session.end().catch(() => {});
        setTimeout(() => {
          const endScreen = document.getElementById('end-screen');
          if (endScreen) endScreen.classList.add('visible');
        }, 1500);
      });

      // Inicia o áudio imediatamente no gesto do usuário,
      // antes de aguardar a inicialização da sessão XR
      audio.play().catch(e => console.warn('Audio play failed:', e));
    }

    // Solicita a sessão XR (também precisa do gesto do usuário)
    let session;
    try {
      session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
      });
    } catch (err) {
      console.error('WebXR requestSession failed:', err);
      return;
    }

    // Sinaliza que a sessão está pronta — constrói palavras se a fonte já carregou
    sessionReady = true;
    if (fontReady && !breathMeshes) buildWords();

    await renderer.xr.setSession(session);

    currentMode = 'gentle';
    renderer.setAnimationLoop(animate);

    const arLaunch = document.getElementById('ar-launch');
    arLaunch.classList.remove('visible');
    setTimeout(() => { arLaunch.style.display = 'none'; }, 1300);

    if (arBack)   arBack.classList.add('visible');
    if (audioBar) audioBar.classList.add('visible');

    session.addEventListener('end', () => {
      renderer.setAnimationLoop(null);
    });
  });
}
