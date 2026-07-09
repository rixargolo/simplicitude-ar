import './globals.css';

export const metadata = {
  title: 'Simplicitude',
  description: 'Chocolate artesanal — Da Floresta à Fábrica',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
