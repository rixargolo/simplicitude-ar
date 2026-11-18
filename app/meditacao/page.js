import Meditacao, { metadataMeditacao } from './Meditacao';

export const metadata = metadataMeditacao('pt');

// A página é pré-renderizada; sem isso uma edição no admin só apareceria no próximo build.
export const revalidate = 60;

export default function MeditacaoPage() {
  return <Meditacao idioma="pt" />;
}
