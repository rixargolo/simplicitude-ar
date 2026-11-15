import PaginaLegal from '../components/PaginaLegal';
import { urlCanonica } from '@/lib/site';

export const metadata = {
  alternates: { canonical: urlCanonica('/trocas') },
  title: 'Trocas e Devoluções — Simplicitude',
  description: 'Como pedir troca, devolução ou reembolso: arrependimento, defeito, produto derretido, frete e prazos.',
};

export default function TrocasPage() {
  return <PaginaLegal titulo="Política de Trocas e Devoluções" arquivo="trocas" />;
}
