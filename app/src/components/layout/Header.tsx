
import React from 'react';
import { useLocation } from 'react-router-dom';
import Logo from './navigation/Logo';
import NavigationLinks from './navigation/NavigationLinks';
import CartButton from './navigation/CartButton';
import WalletStatus from './navigation/WalletStatus';
import { useHeaderCart } from '@/hooks/useHeaderCart';
import { useWalletConnect } from '@/hooks/useWalletConnect';

const Header: React.FC = () => {
  const { walletStatus, connectWallet } = useWalletConnect();
  const { totalCartItems } = useHeaderCart();
  const location = useLocation();
  
  const isDashboardPage = location.pathname.includes('/dashboard');
  const isStorePage = location.pathname.includes('/store');
  const isCartPage = location.pathname.includes('/cart');
  const isProfilePage = location.pathname.includes('/profile');

  return (
    <header className="flex justify-between items-center py-4 px-6 border-b bg-white">
      <div className="flex items-center">
        <Logo />
      </div>

      <nav className="hidden md:flex space-x-4">
        {location.pathname !== '/' && (
          <NavigationLinks
            isCartPage={isCartPage}
            isProfilePage={isProfilePage}
            isStorePage={isStorePage}
          />
        )}
      </nav>

      <div className="flex items-center space-x-4">
        {/* Cart Icon - Show only if not on the cart page and there are items in cart */}
        {!isCartPage && (
          <CartButton totalItems={totalCartItems} />
        )}

        <WalletStatus 
          isConnected={walletStatus.connected}
          onConnectWallet={connectWallet}
        />
      </div>
    </header>
  );
};

export default Header;
