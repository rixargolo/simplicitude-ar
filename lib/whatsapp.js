// WhatsApp da Simplicitude: o número mora SÓ aqui (rodapé e botão Comprar leem daqui).
// Formato wa.me: código do país + DDD + número, só dígitos.
export const WHATSAPP_NUMERO = '5573920026708';
export const WHATSAPP_EXIBICAO = '(73) 9 2002-6708';

// Link do WhatsApp, com mensagem pronta quando `texto` vem preenchido.
export function linkWhatsApp(texto) {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

// Mensagem do botão Comprar: nome do produto e endereço da página. Sem artigo ("o/a"):
// os nomes variam de gênero. Serve também ao produto esgotado.
export function linkCompra(nome, url) {
  return linkWhatsApp(`Olá! Tenho interesse em: ${nome}\n${url}`);
}
