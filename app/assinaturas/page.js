import EmBreve from '../components/EmBreve';
import { exigirMockups } from '@/lib/navegacao';

export const metadata = { title: 'Assinaturas — Simplicitude' };

export default function AssinaturasPage() {
  exigirMockups();
  return <EmBreve titulo="Assinaturas" />;
}
