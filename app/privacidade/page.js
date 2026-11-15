import PaginaLegal from '../components/PaginaLegal';
import { urlCanonica } from '@/lib/site';

export const metadata = {
  alternates: { canonical: urlCanonica('/privacidade') },
  title: 'Política de Privacidade — Simplicitude',
  description: 'Quais dados pessoais a Simplicitude coleta, para que usa, com quem compartilha e como você exerce seus direitos (LGPD).',
};

export default function PrivacidadePage() {
  return <PaginaLegal titulo="Política de Privacidade" arquivo="privacidade" />;
}
