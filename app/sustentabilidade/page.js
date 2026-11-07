import EmBreve from '../components/EmBreve';
import { exigirMockups } from '@/lib/navegacao';

export const metadata = { title: 'Sustentabilidade — Simplicitude' };

export default function SustentabilidadePage() {
  exigirMockups();
  return <EmBreve titulo="Sustentabilidade" />;
}
