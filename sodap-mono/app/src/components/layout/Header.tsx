
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Logo from './navigation/Logo';
import NavigationLinks from './navigation/NavigationLinks';
import CartButton from './navigation/CartButton';
import WalletStatus from './navigation/WalletStatus';
import { useHeaderCart } from '@/hooks/useHeaderCart';
import { useWalletConnect } from '@/hooks/useWalletConnect';

interface HeaderProps {
  role?: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
}

const Header: React.FC<HeaderProps> = ({ role = 'end_user' }) => {
  const { walletStatus, connectWallet, disconnectWallet } = useWalletConnect();
  const { totalCartItems } = useHeaderCart();
  const location = useLocation();
  // If role prop is provided, use it; otherwise, try to get it from session storage
  const [userRole, setUserRole] = React.useState<'platform_admin' | 'store_manager' | 'store_staff' | 'end_user'>(role);
  
  // Get user role from session storage only if role prop is 'end_user'
  React.useEffect(() => {
    if (role === 'end_user') {
      const storedRole = sessionStorage.getItem('userRole');
      if (storedRole === 'platform_admin' || storedRole === 'store_manager' || storedRole === 'store_staff') {
        setUserRole(storedRole as 'platform_admin' | 'store_manager' | 'store_staff');
      }
    }
  }, [role]);
  
  const isDashboardPage = location.pathname.includes('/dashboard');
  const isStorePage = location.pathname.includes('/store');
  const isCartPage = location.pathname.includes('/cart');
  const isProfilePage = location.pathname.includes('/profile');
  const isShopPage = location.pathname.includes('/shop');

  return (
    <header className="flex justify-between items-center py-4 px-6 border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="flex items-center">
        <Link to="/store-selection" className="flex items-center">
          <Logo />
        </Link>
      </div>

      <nav className="hidden md:flex space-x-4">
        {location.pathname !== '/landing' && (
          <NavigationLinks
            isCartPage={isCartPage}
            isProfilePage={isProfilePage}
            isStorePage={isStorePage}
            isShopPage={isShopPage}
            role={userRole}
          />
        )}
      </nav>

      <div className="flex items-center space-x-4">
        {/* Cart Icon - Show only if not on the cart page and not on admin/manager/refunds dashboard */}
        {!isCartPage && !(location.pathname === '/dashboard/admin' || 
                          location.pathname === '/dashboard/manager' || 
                          location.pathname === '/dashboard/refunds') && (
          <CartButton totalItems={totalCartItems} />
        )}

        <WalletStatus 
          isConnected={walletStatus.connected}
          walletAddress={walletStatus.address}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          onChangeWallet={() => {
            // First disconnect, then connect to open wallet selector
            disconnectWallet();
            setTimeout(() => connectWallet(), 500);
          }}
        />
      </div>
    </header>
  );
};

export default Header;
