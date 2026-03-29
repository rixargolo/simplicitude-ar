/**
 * ════════════════════════════════════════════════════════════════
 *  SIMPLICITUDE AR — ar.js
 *  Experiência de realidade aumentada para o chocolate Alegria
 *
 *  Estrutura deste arquivo:
 *    1. FASES DA MEDITAÇÃO   — timing e modo visual de cada trecho do áudio
 *    2. CENA THREE.JS        — renderer, câmera, luzes
 *    3. GIROSCÓPIO           — rotação da câmera virtual pelo DeviceOrientation
 *    4. PARTÍCULAS           — nuvem de pontos dourados/âmbar ao redor da cena
 *    5. ANÉIS (RINGS)        — toros que pulsam no modo 'breath' e 'solar'
 *    6. ORBS                 — esferas pequenas que orbitam o centro
 *    7. SOL (SUN)            — esfera central + raios que aparecem nas fases solares
 *    8. MOMENTOS DE TEXTO    — palavras 3D sincronizadas com o áudio (ver MDEFS)
 *       8a. Definições (MDEFS)
 *       8b. Construtores de geometria de texto
 *       8c. Build (cria todos os objetos 3D de texto)
 *       8d. Update (anima cada momento a cada frame)
 *    9. LOOP DE ANIMAÇÃO     — animate() — roda a 60fps, atualiza tudo
 *   10. CONTROLE DE FASES    — lê o tempo do áudio e troca o modo visual
 *   11. INICIALIZAÇÃO        — câmera do celular + clique no botão Iniciar
 * ════════════════════════════════════════════════════════════════
 */


// ════════════════════════════════════════════════════════════════
//  1. FASES DA MEDITAÇÃO
//     Cada fase define um intervalo de tempo (em segundos) do áudio
//     e o modo visual correspondente.
//     O texto de legenda (label) aparece no HUD durante a fase.
// ════════════════════════════════════════════════════════════════

const PHASES = [
  { start:   0, end:  10, label: '',                                                mode: 'idle'   },
  { start:  10, end:  43, label: 'Encontre um local confortável\ne esteja presente.',mode: 'gentle' },
  { start:  43, end: 108, label: 'Inspire profundamente…\nExale lentamente…',        mode: 'breath' },
  { start: 108, end: 161, label: 'Sinta a textura.\nO aroma que ele exhala.',        mode: 'aroma'  },
  { start: 161, end: 233, label: 'Laranja · Cardamomo · Cacau\nEnergia e vitalidade.',mode: 'warm'  },
  { start: 233, end: 266, label: 'Seco ao sol,\nabsorvendo a energia divina.',       mode: 'solar'  },
  { start: 266, end: 322, label: 'Sinta a alegria crescendo,\nirradiando ao seu redor.',mode:'burst' },
];

/**
 * MODOS VISUAIS — cada modo define a intensidade de cada camada:
 *   p   = opacidade das partículas
 *   o   = opacidade dos orbs
 *   r   = opacidade dos anéis (0 = apagado)
 *   sun = se o sol e os raios aparecem
 *
 * Para ajustar a intensidade de qualquer camada em qualquer fase,
 * edite os valores abaixo.
 */
const MODES = {
  idle:   { p: 0.00, o: 0.00, r: 0.00, sun: false },
  gentle: { p: 0.22, o: 0.12, r: 0.00, sun: false },
  breath: { p: 0.28, o: 0.28, r: 0.70, sun: false },
  aroma:  { p: 0.42, o: 0.40, r: 0.00, sun: false },
  warm:   { p: 0.58, o: 0.55, r: 0.00, sun: false },
  solar:  { p: 0.55, o: 0.50, r: 0.25, sun: true  },
  burst:  { p: 0.85, o: 0.85, r: 0.45, sun: true  },
};


// ════════════════════════════════════════════════════════════════
//  2. CENA THREE.JS
// ════════════════════════════════════════════════════════════════

const canvas3D  = document.getElementById('three-canvas');
const renderer  = new THREE.WebGLRenderer({ canvas: canvas3D, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0, 0); // fundo transparente — mostra a câmera

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 200);

// Luzes (afetam apenas materiais MeshStandardMaterial — usado nas letras 3D INSPIRE/EXPIRE)
const ambientLight     = new THREE.AmbientLight(0xffffff, 0.7);
const directionalLight = new THREE.DirectionalLight(0xFFE8C0, 1.4);
directionalLight.position.set(0, 3, -3);
scene.add(ambientLight, directionalLight);

// Ajusta tamanho do canvas ao redimensionar a janela
function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
onResize();
window.addEventListener('resize', onResize);


// ════════════════════════════════════════════════════════════════
//  3. GIROSCÓPIO — rotação da câmera virtual pelo celular
//     Usa DeviceOrientationEvent para transformar a orientação
//     física do dispositivo em quaternion da câmera Three.js.
//     Ao iniciar, "zera" a orientação frontal como referência.
// ════════════════════════════════════════════════════════════════

// Constantes de conversão device → world
const _euler  = new THREE.Euler();
const _qScreen = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° X
const _qOrient = new THREE.Quaternion();
const _qDevice = new THREE.Quaternion();

// Última leitura bruta dos sensores (em radianos)
let _alpha = 0, _beta = 0, _gamma = 0, _screenAngle = 0;
let _deviceActive = false;

// Quaternion inverso do frame frontal (capturado na primeira leitura)
let _initialInverse = null;

function onDeviceOrientation(e) {
  _alpha       = THREE.MathUtils.degToRad(e.alpha  || 0);
  _beta        = THREE.MathUtils.degToRad(e.beta   || 0);
  _gamma       = THREE.MathUtils.degToRad(e.gamma  || 0);
  _screenAngle = window.screen?.orientation?.angle
    ? THREE.MathUtils.degToRad(window.screen.orientation.angle)
    : 0;
  _deviceActive = true;
}

function updateCameraOrientation() {
  if (!_deviceActive) return;

  // Constrói quaternion do device com a ordem correta para telas em retrato
  _euler.set(_beta, _alpha, -_gamma, 'YXZ');
  _qDevice.setFromEuler(_euler);
  _qDevice.multiply(_qScreen);

  // Compensa rotação da tela (landscape vs portrait)
  _qOrient.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -_screenAngle);
  _qDevice.multiply(_qOrient);

  // Na primeira leitura, salva o inverso como "frente" do usuário
  if (!_initialInverse) {
    _initialInverse = _qDevice.clone().invert();
  }

  // Aplica rotação relativa à posição inicial
  camera.quaternion.multiplyQuaternions(_initialInverse, _qDevice);
}

function initGyroscope() {
  const addListener = () => window.addEventListener('deviceorientation', onDeviceOrientation);

  // iOS 13+ exige permissão explícita do usuário
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(result => { if (result === 'granted') addListener(); })
      .catch(() => {});
  } else {
    addListener();
  }
}


// ════════════════════════════════════════════════════════════════
//  4. PARTÍCULAS
//     900 pontos espalhados em uma esfera ao redor da câmera.
//     Cores: paleta dourada/âmbar inspirada no Alegria.
//     Cada partícula tem velocidade e fase próprias para movimento orgânico.
// ════════════════════════════════════════════════════════════════

const PARTICLE_COUNT = 900;

// Paleta de cores das partículas [R, G, B] em 0–1
const PARTICLE_PALETTE = [
  [0.831, 0.659, 0.263], // ouro
  [0.910, 0.475, 0.227], // âmbar
  [0.961, 0.929, 0.847], // creme
  [1.000, 0.820, 0.376], // dourado claro
  [0.784, 0.475, 0.255], // terracota
];

const pPositions = new Float32Array(PARTICLE_COUNT * 3);
const pColors    = new Float32Array(PARTICLE_COUNT * 3);
const pSizes     = new Float32Array(PARTICLE_COUNT);
const pVelocity  = new Float32Array(PARTICLE_COUNT * 3);
const pPhase     = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  // Posição inicial: espalha em esfera hollow
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = 4 + Math.random() * 13;
  pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  pPositions[i*3+2] = -(2 + Math.random() * 11); // sempre à frente da câmera

  // Cor aleatória da paleta
  const col = PARTICLE_PALETTE[Math.floor(Math.random() * PARTICLE_PALETTE.length)];
  pColors[i*3] = col[0]; pColors[i*3+1] = col[1]; pColors[i*3+2] = col[2];

  // Tamanho e velocidade individuais
  pSizes[i]        = 4 + Math.random() * 20;
  pVelocity[i*3]   = (Math.random() - 0.5) * 0.004;
  pVelocity[i*3+1] = 0.003 + Math.random() * 0.006; // sempre sobe levemente
  pVelocity[i*3+2] = (Math.random() - 0.5) * 0.002;
  pPhase[i]        = Math.random() * Math.PI * 2;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
particleGeometry.setAttribute('color',    new THREE.BufferAttribute(pColors, 3));
particleGeometry.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1));

// Shader personalizado: círculos suaves com fade de distância
const particleMaterial = new THREE.ShaderMaterial({
  uniforms: { op: { value: 0 } }, // opacidade global controlada pelo modo

  vertexShader: `
    attribute float size;
    attribute vec3  color;
    varying   vec3  vC;
    varying   float vFade;
    void main() {
      vC = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (260.0 / -mv.z); // tamanho em perspectiva
      gl_Position  = projectionMatrix * mv;
      vFade = clamp(1.0 - length(mv.xyz) / 22.0, 0.0, 1.0); // fade por distância
    }
  `,

  fragmentShader: `
    uniform float op;
    varying vec3  vC;
    varying float vFade;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;                         // descarta fora do círculo
      float alpha = pow(1.0 - d * 2.0, 2.0);        // borda suave
      gl_FragColor = vec4(vC, alpha * op * vFade);
    }
  `,

  transparent: true,
  depthWrite:  false,
  blending:    THREE.AdditiveBlending,
  vertexColors: true,
});

const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleMesh);


// ════════════════════════════════════════════════════════════════
//  5. ANÉIS (RINGS)
//     Três toros concêntricos na frente da câmera.
//     Ficam visíveis nos modos 'breath' e 'solar'.
//     Pulsam em escala no ritmo da respiração (~11s de ciclo).
// ════════════════════════════════════════════════════════════════

const ringGroup = new THREE.Group();
ringGroup.position.z = -6;
scene.add(ringGroup);

// Helper: cria um toro e retorna apenas o material (para animação de opacidade)
function makeRing(radius, tube, color) {
  const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 });
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 120), mat);
  ringGroup.add(mesh);
  return mat;
}

// Três anéis em raios/espessuras diferentes
const ringMat1 = makeRing(1.6, 0.009, 0xD4A843); // dourado
const ringMat2 = makeRing(1.0, 0.006, 0xFFD060); // amarelo
const ringMat3 = makeRing(2.3, 0.004, 0xE8793A); // âmbar

let ringBreathTimer = 0; // acumula tempo para o ciclo de pulso


// ════════════════════════════════════════════════════════════════
//  6. ORBS
//     14 esferas pequenas que orbitam o centro em raios variados.
//     Ficam visíveis a partir do modo 'gentle'.
// ════════════════════════════════════════════════════════════════

const orbGroup = new THREE.Group();
scene.add(orbGroup);

const orbData = []; // guarda dados de animação de cada orb

for (let i = 0; i < 14; i++) {
  const angle  = (i / 14) * Math.PI * 2;
  const radius = 1.3 + Math.random() * 2.8;
  const depth  = -(3 + Math.random() * 9);
  const col    = PARTICLE_PALETTE[Math.floor(Math.random() * PARTICLE_PALETTE.length)];

  const mat  = new THREE.MeshBasicMaterial({
    color: new THREE.Color(col[0], col[1], col[2]),
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random() * 0.13, 8, 8), mat);
  mesh.position.set(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5,
    depth
  );
  orbGroup.add(mesh);

  orbData.push({
    mesh,
    mat,
    angle,                            // ângulo base da órbita
    radius,
    depth,
    speed: 0.001 + Math.random() * 0.003, // velocidade orbital
    phase: Math.random() * Math.PI * 2,   // fase do balanço vertical
  });
}


// ════════════════════════════════════════════════════════════════
//  7. SOL (SUN)
//     Três esferas concêntricas (núcleo + halos) + 18 raios lineares.
//     Aparece apenas nos modos 'solar' e 'burst'.
// ════════════════════════════════════════════════════════════════

const sunGroup = new THREE.Group();
sunGroup.position.set(0, 0.3, -7); // levemente acima do centro, atrás da cena
scene.add(sunGroup);

// Helper: cria uma esfera dentro do sunGroup e retorna o material
function makeSunSphere(radius, color, side = THREE.FrontSide) {
  const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), mat);
  sunGroup.add(mesh);
  return mat;
}

const sunCoreMat  = makeSunSphere(0.2, 0xFFE880);                    // núcleo brilhante
const sunHalo1Mat = makeSunSphere(0.6, 0xD4A843, THREE.BackSide);   // halo dourado
const sunHalo2Mat = makeSunSphere(1.2, 0xE8793A, THREE.BackSide);   // halo âmbar

// 18 raios distribuídos em círculo
const rayMaterials = [];
for (let i = 0; i < 18; i++) {
  const angle = (i / 18) * Math.PI * 2;
  const mat   = new THREE.LineBasicMaterial({ color: 0xFFD060, transparent: true, opacity: 0 });
  const line  = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0), // início (borda do núcleo)
      new THREE.Vector3(Math.cos(angle) * 2.20, Math.sin(angle) * 2.20, 0), // fim (extensão)
    ]),
    mat
  );
  sunGroup.add(line);
  rayMaterials.push(mat);
}


// ════════════════════════════════════════════════════════════════
//  8. MOMENTOS DE TEXTO (TEXT MOMENTS)
//     Palavras-chave do áudio renderizadas como geometria 3D.
//     Cada momento tem um tipo (tp) que define o comportamento visual.
//
//  8a. DEFINIÇÕES (MDEFS)
//      Edite aqui para mudar quais palavras aparecem, quando e como.
//
//      Campos:
//        id    → identificador único (só para debug)
//        st    → segundo de início (no áudio)
//        en    → segundo de fim
//        tp    → tipo de animação (ver lista abaixo)
//        w     → texto ou array de textos
//        col   → cor hex ou array de cores
//        sz    → tamanho da fonte (metros na cena 3D)
//
//  Tipos de animação disponíveis:
//    'breath'  → INSPIRE / EXPIRE alternados em 3D com bevel (especial)
//    'shimmer' → aparece com ondulação de vértices (efeito água)
//    'rise2'   → duas palavras sobem do chão juntas
//    'drip'    → palavra derrete para baixo
//    'burst'   → palavra pulsa + explode partículas ao redor
//    'ember'   → pisca lentamente como brasa
//    'ghost'   → translúcido, flutua levemente
//    'solar2'  → brilha com blending aditivo, pulsa
//    'rise'    → sobe de baixo para o centro
//    'expand'  → letras se separam radialmente
//    'plain'   → aparece e desaparece sem efeito
//    'gratid'  → igual 'plain' mas com fade mais lento (fim da meditação)
// ════════════════════════════════════════════════════════════════

const MOMENT_DEFS = [
  // id         st    en    tp          w               col         sz
  { id:'breath', st:  43, en:108, tp:'breath'                                          },
  { id:'sinta',  st: 108, en:115, tp:'shimmer', w:'SINTA',      col:0xE8D5B0, sz:.28  },
  { id:'mata',   st: 119, en:128, tp:'rise2',   w:['MATA','ATLANTICA'], col:[0x6AAF4A,0x4A9F3A], sz:.20 },
  { id:'derreta',st: 140, en:149, tp:'drip',    w:'DERRETA',    col:0xFFD080, sz:.28  },
  { id:'alegria',st: 168, en:177, tp:'burst',   w:'ALEGRIA',    col:0xFFD040, sz:.40  },
  { id:'quente', st: 175, en:184, tp:'ember',   w:'QUENTE',     col:0xFF6020, sz:.28  },
  { id:'bemest', st: 210, en:219, tp:'ghost',   w:'BEM-ESTAR',  col:0xFFF4E0, sz:.22  },
  { id:'solar2', st: 233, en:242, tp:'solar2',  w:'SOLAR',      col:0xFFFFCC, sz:.34  },
  { id:'nasce',  st: 255, en:264, tp:'rise',    w:'NASCE',      col:0xFFE060, sz:.28  },
  { id:'irradia',st: 266, en:276, tp:'expand',  w:'IRRADIA',    col:0xFF9040, sz:.26  },
  { id:'agora',  st: 279, en:287, tp:'plain',   w:'AGORA',      col:0xFFFFFF, sz:.30  },
  { id:'gratid', st: 289, en:322, tp:'gratid',  w:'GRATIDAO',   col:0xFFD040, sz:.32  },
];

// Z fixo de todos os textos: distância da câmera (metros negativos = à frente)
const TEXT_Z = -5;

let _loadedFont = null; // Three.js Font, preenchida pelo FontLoader
let _moments    = [];   // lista de instâncias de momentos com seus meshes

// Tempo corrente do áudio (atualizado pelo timeupdate listener)
let _audioTime  = 0;


// ────────────────────────────────────────
//  8b. CONSTRUTORES DE GEOMETRIA DE TEXTO
// ────────────────────────────────────────

/**
 * Cria um mesh de texto simples (plano, sem bevel).
 * Centraliza automaticamente pelo bounding box.
 */
function makeTextMesh(font, word, color, size) {
  const geometry = new THREE.TextGeometry(word, {
    font,
    size:           size || 0.28,
    height:         0.04,
    curveSegments:  4,
    bevelEnabled:   false,
  });

  // Centraliza no eixo X e Y
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  geometry.translate(
    -(bb.max.x + bb.min.x) / 2,
    -(bb.max.y + bb.min.y) / 2,
    0
  );

  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
  );
}

/**
 * Cria um mesh de texto 3D com bevel e material StandardMaterial.
 * Usado exclusivamente nas palavras INSPIRE / EXPIRE.
 */
function make3DTextMesh(font, word) {
  const geometry = new THREE.TextGeometry(word, {
    font,
    size:             0.50,
    height:           0.22,
    curveSegments:    6,
    bevelEnabled:     true,
    bevelThickness:   0.018,
    bevelSize:        0.010,
    bevelSegments:    3,
  });

  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  geometry.translate(
    -(bb.max.x + bb.min.x) / 2,
    -(bb.max.y + bb.min.y) / 2,
    -(bb.max.z + bb.min.z) / 2
  );

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color:            0xFFF6E8,
    emissive:         0x774422,
    emissiveIntensity: 0.45,
    metalness:        0.08,
    roughness:        0.55,
    transparent:      true,
    opacity:          0,
  }));

  mesh.position.set(0, 0, TEXT_Z);
  mesh.scale.setScalar(0);
  scene.add(mesh);
  return mesh;
}


// ────────────────────────────────────────
//  8c. BUILD — monta todos os meshes de texto
//      Chamado pelo FontLoader quando a fonte carrega
// ────────────────────────────────────────

function buildMoments(font) {
  _loadedFont = font;

  MOMENT_DEFS.forEach(def => {
    const mo = { def, op: 0 }; // op = opacidade acumulada (0→1→0)

    switch (def.tp) {

      // ── INSPIRE / EXPIRE — dois meshes 3D alternados ──
      case 'breath':
        mo.inspire = make3DTextMesh(font, 'INSPIRE');
        mo.expire  = make3DTextMesh(font, 'EXPIRE');
        break;

      // ── RISE2 — duas palavras que sobem juntas ──
      case 'rise2':
        mo.m1 = makeTextMesh(font, def.w[0], def.col[0], def.sz);
        mo.m2 = makeTextMesh(font, def.w[1], def.col[1], def.sz);
        mo.m1.position.set(-2.2, -2.2, TEXT_Z);
        mo.m2.position.set( 1.8, -2.2, TEXT_Z);
        scene.add(mo.m1, mo.m2);
        break;

      // ── EXPAND — letras que se separam ──
      case 'expand': {
        const letters = def.w.split('');
        const n       = letters.length;
        mo.letters = letters.map((ch, i) => {
          const m   = makeTextMesh(font, ch, def.col, def.sz);
          const baseX = (i - (n - 1) / 2) * def.sz * 0.9;
          m.position.set(baseX, 0, TEXT_Z);
          m.userData.baseX   = baseX;
          m.userData.relIndex = i - (n - 1) / 2; // posição relativa ao centro
          scene.add(m);
          return m;
        });
        break;
      }

      // ── BURST — palavra pulsante + partículas que explodem ──
      case 'burst': {
        mo.m = makeTextMesh(font, def.w, def.col, def.sz);
        mo.m.position.z = TEXT_Z;
        scene.add(mo.m);

        // Prepara 100 partículas de burst com velocidades aleatórias
        const BURST_N = 100;
        const burstPositions = new Float32Array(BURST_N * 3);
        mo.burstVelocities = Array.from({ length: BURST_N }, () => {
          const a  = Math.random() * Math.PI * 2;
          const e  = (Math.random() - 0.5) * Math.PI;
          const sp = 0.6 + Math.random() * 1.8;
          return {
            vx: Math.cos(a) * Math.cos(e) * sp,
            vy: Math.sin(e) * sp * 0.7,
            vz: Math.sin(a) * Math.cos(e) * sp * 0.3,
          };
        });
        mo.burstPositions = burstPositions;

        // Inicializa posições no centro
        for (let i = 0; i < BURST_N; i++) {
          burstPositions[i*3] = 0;
          burstPositions[i*3+1] = 0;
          burstPositions[i*3+2] = TEXT_Z;
        }

        const burstGeo = new THREE.BufferGeometry();
        burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
        mo.burstMesh = new THREE.Points(burstGeo, new THREE.PointsMaterial({
          color:      0xFFE060,
          size:       0.08,
          transparent: true,
          opacity:    0,
          blending:   THREE.AdditiveBlending,
          depthWrite: false,
        }));
        scene.add(mo.burstMesh);
        break;
      }

      // ── RISE — palavra que sobe de baixo ──
      case 'rise':
        mo.m = makeTextMesh(font, def.w, def.col, def.sz);
        mo.m.position.set(0, -1.8, TEXT_Z);
        scene.add(mo.m);
        break;

      // ── SOLAR2 — usa blending aditivo para brilhar ──
      case 'solar2':
        mo.m = makeTextMesh(font, def.w, def.col, def.sz);
        mo.m.position.set(0, 0, TEXT_Z);
        mo.m.material.blending = THREE.AdditiveBlending;
        scene.add(mo.m);
        break;

      // ── SHIMMER e DRIP — precisam salvar os vértices originais ──
      case 'shimmer':
      case 'drip':
        mo.m = makeTextMesh(font, def.w, def.col, def.sz);
        mo.m.position.set(0, 0, TEXT_Z);
        scene.add(mo.m);
        // Salva posições originais dos vértices para distorção
        mo.originalVertices = new Float32Array(mo.m.geometry.attributes.position.array);
        break;

      // ── Todos os outros: mesh simples centralizado ──
      default:
        mo.m = makeTextMesh(font, def.w, def.col, def.sz);
        mo.m.position.set(0, 0, TEXT_Z);
        scene.add(mo.m);
        break;
    }

    _moments.push(mo);
  });
}


// ────────────────────────────────────────
//  8d. UPDATE — anima os momentos a cada frame
//      Chamado dentro de animate() com delta de tempo e tempo global
// ────────────────────────────────────────

function updateMoments(deltaTime, globalTime, audioTime) {
  if (!_loadedFont) return;

  _moments.forEach(mo => {
    const def      = mo.def;
    const duration = def.en - def.st;
    const inRange  = audioTime >= def.st && audioTime < def.en;
    const elapsed  = Math.max(0, Math.min(duration, audioTime - def.st));
    const remaining = def.en - audioTime;

    // ── Fade in / out baseado em tempo ──
    // 'gratid' tem fade muito mais longo para o encerramento
    const fadeInDur  = def.tp === 'gratid' ?  6 : Math.min(1.5, duration * 0.15);
    const fadeOutDur = def.tp === 'gratid' ? 10 : Math.min(2.0, duration * 0.20);
    const ghostMult  = def.tp === 'ghost' ? 0.38 : 1; // ghost é mais transparente

    const targetOp = inRange
      ? Math.min(elapsed / fadeInDur, 1, remaining / fadeOutDur) * ghostMult
      : 0;

    // Suaviza a transição de opacidade (não é instantânea)
    mo.op += (targetOp - mo.op) * 0.05;
    const op = mo.op;

    // ── Animação específica por tipo ──
    switch (def.tp) {

      // ── INSPIRE / EXPIRE — alterna a cada 5s dentro de ciclo de 10s ──
      case 'breath': {
        const cycleTime = elapsed % 10;
        const isInspire = cycleTime < 5;
        const phaseTime = isInspire ? cycleTime : cycleTime - 5;
        const wave      = Math.sin((phaseTime / 5) * Math.PI); // 0→1→0

        const targetInspireScale = isInspire ? wave : 0;
        const targetExpireScale  = isInspire ? 0 : wave;
        const targetInspireOp    = isInspire ? wave * op : 0;
        const targetExpireOp     = isInspire ? 0 : wave * op;

        // Suaviza escala e opacidade
        mo.inspire.scale.setScalar(mo.inspire.scale.x + (targetInspireScale - mo.inspire.scale.x) * 0.07);
        mo.expire.scale.setScalar(mo.expire.scale.x   + (targetExpireScale  - mo.expire.scale.x)  * 0.07);
        mo.inspire.material.opacity += (targetInspireOp - mo.inspire.material.opacity) * 0.07;
        mo.expire.material.opacity  += (targetExpireOp  - mo.expire.material.opacity)  * 0.07;
        break;
      }

      // ── SHIMMER — ondula os vértices como superfície de água ──
      case 'shimmer': {
        mo.m.material.opacity = op;
        if (mo.originalVertices && op > 0.01) {
          const pos    = mo.m.geometry.attributes.position;
          const waveTime = globalTime * 4;
          for (let i = 0; i < pos.count; i++) {
            const ox = mo.originalVertices[i*3];
            const oy = mo.originalVertices[i*3+1];
            const dist = Math.sqrt(ox*ox + oy*oy) + 0.001;
            // onda radial: propaga do centro para fora
            const wave = Math.sin(dist * 10 - waveTime) * 0.025 * op;
            pos.array[i*3]   = ox + (ox / dist) * wave;
            pos.array[i*3+1] = oy + (oy / dist) * wave;
          }
          pos.needsUpdate = true;
        }
        break;
      }

      // ── RISE2 — duas palavras sobem ao mesmo tempo ──
      case 'rise2': {
        const progress = Math.min(elapsed / 3, 1);
        const y        = -2.2 + 2.2 * progress;
        mo.m1.position.y = y;
        mo.m2.position.y = y;
        mo.m1.material.opacity = op;
        mo.m2.material.opacity = op * 0.9;
        break;
      }

      // ── DRIP — vértices derretem para baixo ao longo do tempo ──
      case 'drip': {
        mo.m.material.opacity = op;
        if (mo.originalVertices && elapsed > 1.5) {
          const meltProgress = Math.min((elapsed - 1.5) / 4, 1);
          const pos = mo.m.geometry.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const oy = mo.originalVertices[i*3+1];
            // vértices mais baixos derretem mais rápido
            pos.array[i*3+1] = oy - meltProgress * meltProgress * (0.5 + Math.max(0, -oy) * 2) * 1.2;
          }
          pos.needsUpdate = true;
        }
        break;
      }

      // ── BURST — pulsa + explode partículas em torno ──
      case 'burst': {
        mo.m.material.opacity = op;
        mo.m.scale.setScalar(1 + 0.08 * Math.sin(globalTime * 3)); // pulso

        if (mo.burstMesh) {
          const spread   = Math.min(elapsed * 0.8, 3); // expande com o tempo
          const burstOp  = Math.min(elapsed, 1) * Math.min(remaining / 3, 1) * op * 0.9;
          mo.burstMesh.material.opacity = burstOp;

          for (let i = 0; i < mo.burstVelocities.length; i++) {
            const v = mo.burstVelocities[i];
            mo.burstPositions[i*3]   = v.vx * spread;
            mo.burstPositions[i*3+1] = v.vy * spread;
            mo.burstPositions[i*3+2] = TEXT_Z + v.vz * spread;
          }
          mo.burstMesh.geometry.attributes.position.needsUpdate = true;
        }
        break;
      }

      // ── EMBER — pisca como brasa ──
      case 'ember':
        mo.m.material.opacity = op * (0.6 + 0.4 * Math.sin(globalTime * 1.8));
        break;

      // ── GHOST — flutua levemente, semi-transparente ──
      case 'ghost':
        mo.m.material.opacity = op;
        mo.m.position.y = Math.sin(globalTime * 0.7) * 0.05;
        break;

      // ── SOLAR2 — brilha e pulsa com blending aditivo ──
      case 'solar2':
        mo.m.material.opacity = op * (0.65 + 0.35 * Math.sin(globalTime * 4.5));
        mo.m.scale.setScalar(1 + 0.06 * Math.sin(globalTime * 2));
        break;

      // ── RISE — sobe do chão ao centro ──
      case 'rise':
        mo.m.position.y = -1.8 + 1.8 * Math.min(elapsed / 4, 1);
        mo.m.material.opacity = op;
        break;

      // ── EXPAND — letras se afastam do centro ──
      case 'expand': {
        const expansion = Math.min(elapsed / 4, 1);
        mo.letters.forEach(m => {
          m.position.x = m.userData.baseX + m.userData.relIndex * expansion * 0.9;
          m.material.opacity = op;
        });
        break;
      }

      // ── PLAIN / GRATID — aparece e desaparece sem efeito ──
      case 'plain':
      case 'gratid':
        mo.m.material.opacity = op;
        break;
    }
  });
}

// Carrega a fonte imediatamente — buildMoments() é chamado ao finalizar
new THREE.FontLoader().load(
  'https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json',
  buildMoments
);


// ════════════════════════════════════════════════════════════════
//  9. LOOP DE ANIMAÇÃO
//     Roda a ~60fps, atualiza todas as camadas visuais.
//     Usa lerp (L) para transições suaves entre estados.
// ════════════════════════════════════════════════════════════════

let currentMode = 'idle';
const clock     = new THREE.Clock();
let   globalTime = 0;

// Interpolação linear simples
const lerp = (a, b, t) => a + (b - a) * t;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  globalTime += dt;

  const cfg = MODES[currentMode] || MODES.idle;

  // ── Giroscópio ──
  updateCameraOrientation();

  // ── Partículas ──
  particleMaterial.uniforms.op.value = lerp(particleMaterial.uniforms.op.value, cfg.p, 0.012);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Movimento: velocidade base + oscilação senoidal por fase
    pPositions[i*3]   += pVelocity[i*3]   + Math.sin(globalTime * 0.4 + pPhase[i]) * 0.001;
    pPositions[i*3+1] += pVelocity[i*3+1];
    pPositions[i*3+2] += pVelocity[i*3+2];
    // Recicla partícula que saiu pelo topo
    if (pPositions[i*3+1] > 13) pPositions[i*3+1] = -13;
  }
  particleGeometry.attributes.position.needsUpdate = true;
  particleMesh.rotation.y += 0.0006; // rotação lenta da nuvem

  // ── Anéis ──
  if (cfg.r > 0) {
    // Ciclo de pulso de 11s: expande em 4s → mantém 1s → contrai em 6s
    ringBreathTimer += dt;
    const cy = ringBreathTimer % 11;
    if      (cy < 4) ringGroup.scale.setScalar(lerp(ringGroup.scale.x, 1 + 0.38 * (cy / 4), 0.04));
    else if (cy < 5) ringGroup.scale.setScalar(lerp(ringGroup.scale.x, 1.38, 0.04));
    else             ringGroup.scale.setScalar(lerp(ringGroup.scale.x, 1.38 - 0.38 * ((cy - 5) / 6), 0.04));
  } else {
    ringGroup.scale.setScalar(lerp(ringGroup.scale.x, 1, 0.03));
  }
  ringGroup.rotation.z += 0.002;
  ringMat1.opacity = lerp(ringMat1.opacity, cfg.r * 0.90, 0.018);
  ringMat2.opacity = lerp(ringMat2.opacity, cfg.r * 0.55, 0.018);
  ringMat3.opacity = lerp(ringMat3.opacity, cfg.r * 0.35, 0.018);

  // ── Orbs ──
  orbData.forEach(d => {
    const angle       = d.angle + globalTime * d.speed;
    d.mesh.position.x = Math.cos(angle) * d.radius;
    d.mesh.position.y = Math.sin(angle) * d.radius + Math.sin(globalTime * 0.5 + d.phase) * 0.25;
    // Pisca individualmente para efeito orgânico
    d.mat.opacity = lerp(
      d.mat.opacity,
      cfg.o * (0.4 + 0.6 * Math.abs(Math.sin(globalTime * 0.7 + d.phase))),
      0.012
    );
  });

  // ── Sol ──
  const sunTarget   = cfg.sun ? 1 : 0;
  const sunPulse    = cfg.sun ? 0.85 + 0.15 * Math.sin(globalTime * 1.8) : 0;
  sunCoreMat.opacity  = lerp(sunCoreMat.opacity,  sunTarget * 0.95, 0.012);
  sunHalo1Mat.opacity = lerp(sunHalo1Mat.opacity, sunPulse  * 0.22, 0.012);
  sunHalo2Mat.opacity = lerp(sunHalo2Mat.opacity, sunPulse  * 0.07, 0.012);
  sunGroup.rotation.z += 0.005;

  // Raios do sol
  const rayTargetOp = sunTarget * (0.28 + 0.14 * Math.sin(globalTime * 1.3));
  rayMaterials.forEach(m => {
    m.opacity = lerp(m.opacity, rayTargetOp, 0.012);
  });

  // No burst, o sol escala levemente no ritmo
  if (currentMode === 'burst') {
    sunGroup.scale.setScalar(1 + 0.09 * Math.sin(globalTime * 2.6));
  }

  // ── Momentos de texto ──
  updateMoments(dt, globalTime, _audioTime);

  renderer.render(scene, camera);
}


// ════════════════════════════════════════════════════════════════
//  10. CONTROLE DE FASES
//      Lê o tempo corrente do áudio e determina qual fase está ativa.
//      Atualiza currentMode e o texto do HUD.
// ════════════════════════════════════════════════════════════════

let _currentPhaseIndex = -1;

const phaseLabel    = document.getElementById('phase-label');
const audioBar      = document.getElementById('audio-bar');
const audioProgress = document.getElementById('audio-progress');

function applyPhase(phase) {
  currentMode = phase.mode;

  if (phase.label) {
    // \n vira <br> para respeitar quebras no HTML
    phaseLabel.innerHTML = phase.label.replace(/\n/g, '<br/>');
    phaseLabel.classList.add('visible');
  } else {
    phaseLabel.classList.remove('visible');
  }
}

function checkPhase(audioTime) {
  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i];
    if (audioTime >= phase.start && audioTime < phase.end) {
      if (i !== _currentPhaseIndex) {
        _currentPhaseIndex = i;
        applyPhase(phase);
      }
      return;
    }
  }
}


// ════════════════════════════════════════════════════════════════
//  11. INICIALIZAÇÃO
//      Ativa câmera do celular e inicia a experiência ao clicar.
// ════════════════════════════════════════════════════════════════

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    });
    const videoEl = document.getElementById('camera');
    videoEl.srcObject = stream;
    await videoEl.play();
  } catch (err) {
    console.warn('Câmera não disponível:', err);
  }
}

document.getElementById('ar-launch-play').addEventListener('click', async () => {
  // Inicia câmera e giroscópio em paralelo
  await startCamera();
  initGyroscope();

  // Esconde a tela de lançamento AR com fade
  const arLaunch = document.getElementById('ar-launch');
  arLaunch.classList.remove('visible');
  setTimeout(() => { arLaunch.style.display = 'none'; }, 1300);

  // Mostra o botão de voltar no HUD
  document.getElementById('ar-back').classList.add('visible');

  // Mostra a barra de progresso do áudio
  audioBar.classList.add('visible');

  // Inicia o loop de renderização Three.js
  animate();

  // Toca o áudio (com fallback em caso de política de autoplay)
  const audio = document.getElementById('audio');
  audio.play().catch(() => audio.play());

  // Sincroniza o tempo do áudio com a cena e a barra de progresso
  audio.addEventListener('timeupdate', () => {
    const t  = audio.currentTime;
    _audioTime = t;
    audioProgress.style.width = ((t / audio.duration) * 100) + '%';
    checkPhase(t);
  });

  // Ao terminar: volta para idle e exibe tela final
  audio.addEventListener('ended', () => {
    currentMode = 'idle';
    phaseLabel.classList.remove('visible');
    audioBar.classList.remove('visible');
    setTimeout(() => {
      document.getElementById('end-screen').classList.add('visible');
    }, 1500);
  });
});
