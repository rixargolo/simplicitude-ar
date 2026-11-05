import EmBreve from '../components/EmBreve';
import { exigirMockups } from '@/lib/navegacao';

export const metadata = { title: 'Bem-fazer — Simplicitude' };

export default function BemFazerPage() {
  exigirMockups();
  return <EmBreve titulo="Bem-fazer" />;
}
