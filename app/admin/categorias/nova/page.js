import CategoriaForm from '../CategoriaForm';
import formStyles from '../CategoriaForm.module.css';

export const metadata = {
  title: 'Nova categoria — Admin — Simplicitude',
};

export default function NovaCategoriaPage() {
  return (
    <div className={formStyles.page}>
      <CategoriaForm mode="create" />
    </div>
  );
}
