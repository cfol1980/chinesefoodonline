import './globals.css';

export const metadata = {
  title: 'ChineseFoodOnline',
  description: 'A hub for Chinese food enthusiasts in the U.S.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}