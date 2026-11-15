import { getSlugsProdutosAtivos } from '@/lib/produtos';
import { entradasSitemap } from '@/lib/site';

// Produto novo entra em até 1 h sem rodar uma função a cada acesso.
export const revalidate = 3600;

export default async function sitemap() {
  return entradasSitemap(await getSlugsProdutosAtivos());
}
