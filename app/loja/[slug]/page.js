export default async function ProdutoPage({ params }) {
  const { slug } = await params;

  return (
    <main>
      <p>Produto &quot;{slug}&quot; — em construção</p>
    </main>
  );
}
