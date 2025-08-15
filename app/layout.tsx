import './globals.css';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google';
/*import ModalWrapper from './_components/ModalWrapper';*/

export const metadata = {
  title: 'ChineseFoodOnline',
  description: 'A hub for Chinese food enthusiasts in the U.S.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-green-100 text-black p-4 shadow-md">
          <ul className="flex space-x-4 justify-center">
            <li><Link href="/" className="hover:text-green-700">Home</Link></li>
            <li><Link href="/explore" className="hover:text-green-700">Explore</Link></li>
            <li><Link href="/community" className="hover:text-green-700">Community</Link></li>
            
        
            <li><Link href="/admin" className="hover:text-green-700">Admin</Link></li>
          </ul>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="bg-green-100 p-4 text-center text-gray-600">
          <p>&copy; 2025 ChineseFoodOnline.com All rights reserved.</p>
        </footer>
        <GoogleAnalytics gaId="G-J3TN6EKMY7" /> {/* Add this line */}
      </body>
    </html>
  );
}