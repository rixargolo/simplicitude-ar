import Meditacao, { metadataMeditacao } from '@/app/meditacao/Meditacao';

export const metadata = metadataMeditacao('en');

// Igual à /meditacao: edição no admin vale em até 1 min.
export const revalidate = 60;

export default function MeditacaoEnPage() {
  return <Meditacao idioma="en" />;
}
