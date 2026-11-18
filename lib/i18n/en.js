// Dicionário EN (textos entregues pela dona em 2026-11-18). Mesmas chaves do pt.js, na mesma ordem; arrays com o mesmo
// tamanho. Texto vazio ('') cai no PT (lib/i18n.js, `textos`) e derruba `traducaoCompleta()`: enquanto houver vazio, a
// página EN sai com noindex, sem hreflang e fora do sitemap. Trechos entre ** viram negrito.
// `menu` (só EN): rótulo por href, tradução direta dos rótulos de lib/navegacao.js.
const en = {
  menu: {
    '/loja': 'Shop',
    '/meditacao': 'Meditation',
    '/sustentabilidade': 'Sustainability',
    '/quem-somos': 'About us',
    '/assinaturas': 'Subscriptions',
  },
  meditacao: {
    metaTitulo: 'Meditation — Simplicitude',
    metaDescricao: 'Inspirar Collection — chocolates paired with guided meditations narrated by Bruna Santos.',
    titulo: 'Inspirar Collection',
    subtitulo: 'Chocolates for Meditation',
    frase: 'A self-care ritual in the form of chocolate.',
    cta: 'Access the guided meditations',
    abertura: ['Some chocolate we eat on autopilot.', 'Not this one.'],
    paragrafos: [
      'The Inspirar Collection is an exclusive Simplicitude line that **brings together the nutritional** and sensory benefits of chocolate **with meditation** and mindfulness practices.',
      'It was born from a simple idea: turning a piece of chocolate into a **moment of presence**. Each bar was crafted with **herbs and spices** chosen to awaken a different feeling — Joy, Hope, Serenity. And each one comes with a **guided meditation**, narrated by Bruna Santos.',
      'Combining the properties of the ingredients with the guided meditations, these chocolates encourage a delightful sense of well-being, connecting body and mind in a holistic way.',
      'Experience Simplicitude’s meditative tasting!',
    ],
    fotos: [
      'Dark chocolate bar on a white platter, with cacao leaves, dried orange slices and cardamom',
      'Chocolate bar on a green plate, among mint leaves',
      'White chocolate bar on a leaf-shaped green platter, with coconut flakes and lavender flowers',
    ],
    listaTitulo: 'Guided meditations',
    vazio: 'No chocolates with guided meditation available at the moment.',
    verNaLoja: 'View in shop',
  },
  player: {
    emBreve: 'Guided meditation coming soon',
    botao: 'Taste while listening to the guided meditation narrated by Bruna Santos',
    sub: 'guided audio · tap to listen',
    // aviso do ADR 0002 (áudio EN ainda não existe: toca o PT)
    avisoPt: 'Guided meditation in Portuguese — English version coming soon',
  },
  galeria: { verFoto: 'View photo {n} of {m}' },
  header: {
    navegacao: 'Main navigation',
    navegacaoMobile: 'Main navigation (mobile)',
    abrir: 'Open menu',
    fechar: 'Close menu',
    mudarIdioma: 'Change language',
  },
  busca: { rotulo: 'Search products', abrir: 'Open search', buscar: 'Search' },
  rodape: {
    inicio: 'Simplicitude — home page',
    tagline: 'From Forest to Factory',
    rua: 'Rua Clarindo Teixeira, nº20, 1st floor',
    cidade: 'Centro, Coaraci, Bahia, Brazil.',
    navegacao: 'Navigation (footer)',
    politicas: 'Policies',
    privacidade: 'Privacy',
    entrega: 'Shipping',
    trocas: 'Returns and exchanges',
    direitos: 'All rights reserved.',
    razao: 'Legal name',
  },
};

export default en;
