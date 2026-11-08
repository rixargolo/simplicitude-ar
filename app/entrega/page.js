import PaginaLegal from '../components/PaginaLegal';

export const metadata = {
  title: 'Política de Entrega — Simplicitude',
  description: 'Retirada, entrega local, envio pelos Correios e transportadora, prazos, rastreio e cuidados com o calor.',
};

export default function EntregaPage() {
  return <PaginaLegal titulo="Política de Entrega" arquivo="entrega" />;
}
