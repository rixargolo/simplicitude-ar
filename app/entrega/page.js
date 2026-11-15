import PaginaLegal from '../components/PaginaLegal';
import { urlCanonica } from '@/lib/site';

export const metadata = {
  alternates: { canonical: urlCanonica('/entrega') },
  title: 'Política de Entrega — Simplicitude',
  description: 'Retirada na fábrica, envio pelos Correios para todo o Brasil, prazos, rastreio e cuidados com o calor.',
};

export default function EntregaPage() {
  return <PaginaLegal titulo="Política de Entrega" arquivo="entrega" />;
}
