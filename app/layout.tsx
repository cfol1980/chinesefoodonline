import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'ChineseFoodOnline',
  description: 'A hub for Chinese food enthusiasts in the U.S.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-red-600 text-white p-4">
          <ul className="flex space-x-4 justify-center">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/learn">Learn</Link></li>
            <li><Link href="/community">Community</Link></li>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/login">Login</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}