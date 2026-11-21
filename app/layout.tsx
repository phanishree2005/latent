import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import CurtainTransition from '@/components/CurtainTransition';
import MenuOverlay from '@/components/MenuOverlay';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: "India’s Got Latent Official Merch | Tees, Totes & More",
  description: "Official India's Got Latent streetwear, oversized tees, tote bags, and collectibles curated by Samay Raina.",
  icons: {
    icon: '/images/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-white min-h-screen flex flex-col selection:bg-crimson selection:text-white">
        <CartProvider>
          {/* WebGL Velvet Theater Curtain */}
          <CurtainTransition />

          {/* Top Marquee Announcement Bar */}
          <AnnouncementBar />

          {/* Sticky Navigation Bar */}
          <Header />

          {/* Main Page Content */}
          <main className="flex-1 w-full">
            {children}
          </main>

          {/* Theatrical Fullscreen Menu Drawer */}
          <MenuOverlay />

          {/* Slide-out Cart Drawer */}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
