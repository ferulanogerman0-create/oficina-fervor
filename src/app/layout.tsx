import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oficina FERVOR',
  description: 'Dashboard de clientes FERVOR — Meta Ads · Video Analytics · CRM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
