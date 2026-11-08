import fs from 'node:fs';
import path from 'node:path';

// Data única de "atualizado em" das três páginas legais; mudou um texto em content/legal/, muda aqui.
export const DATA_ATUALIZACAO_LEGAL = '08/11/2026';

// Texto em content/legal/{nome}.md (editável sem mexer em código). Só roda no servidor, no build das
// páginas estáticas: trocar o arquivo exige novo deploy.
export function lerTextoLegal(nome) {
  return fs.readFileSync(path.join(process.cwd(), 'content', 'legal', `${nome}.md`), 'utf8');
}
