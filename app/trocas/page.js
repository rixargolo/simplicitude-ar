import PaginaLegal from '../components/PaginaLegal';

export const metadata = {
  title: 'Trocas e Devoluções — Simplicitude',
  description: 'Como pedir troca, devolução ou reembolso: arrependimento, defeito, produto derretido, frete e prazos.',
};

export default function TrocasPage() {
  return <PaginaLegal titulo="Política de Trocas e Devoluções" arquivo="trocas" />;
}
