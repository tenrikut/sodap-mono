
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

interface NavigationLinksProps {
  isCartPage: boolean;
  isProfilePage: boolean;
  isStorePage: boolean;
  isShopPage?: boolean;
  role?: 'platform_admin' | 'store_manager' | 'store_staff' | 'end_user';
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ 
  isCartPage, 
  isProfilePage, 
  isStorePage,
  isShopPage = false,
  role = 'end_user'
}) => {
  const location = useLocation();
  
  // Rendering different navigation links based on current page
  if (isCartPage) {
    return (
      <>
        <Link 
          to="/" 
          className="px-3 py-2 rounded-md flex items-center text-gray-600 hover:text-sodap-purple"
        >
          <Home size={18} className="mr-1" /> Home
        </Link>
        <Link 
          to="/shop" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/shop') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Shop
        </Link>
        <Link 
          to="/profile?tab=purchases" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/profile') && location.search.includes('tab=purchases') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Purchase History
        </Link>
      </>
    );
  }
  
  if (isProfilePage) {
    return (
      <>
        <Link 
          to="/" 
          className="px-3 py-2 rounded-md flex items-center text-gray-600 hover:text-sodap-purple"
        >
          <Home size={18} className="mr-1" /> Home
        </Link>
        <Link 
          to="/profile" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/profile') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Profile
        </Link>
        <Link 
          to="/shop" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/shop') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Shop
        </Link>
      </>
    );
  }
  
  if (isStorePage) {
    return (
      <>
        <Link 
          to="/dashboard" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/dashboard') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/store" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/store') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Store
        </Link>
      </>
    );
  }
  
  // Special case for shop pages
  if (isShopPage) {
    return (
      <>
        <Link 
          to="/" 
          className="px-3 py-2 rounded-md flex items-center text-gray-600 hover:text-sodap-purple"
        >
          <Home size={18} className="mr-1" /> Home
        </Link>
        <Link 
          to="/shop" 
          className={`px-3 py-2 rounded-md text-sodap-purple font-medium`}
        >
          Shop
        </Link>
        <Link 
          to="/profile?tab=purchases" 
          className={`px-3 py-2 rounded-md text-gray-600 hover:text-sodap-purple`}
        >
          Purchase History
        </Link>
      </>
    );
  }
  
  // Default navigation for other pages based on user role
  if (role === 'platform_admin' || role === 'store_manager' || role === 'store_staff') {
    // Admin/Store Manager/Staff navigation
    return (
      <>
        <Link 
          to="/dashboard" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/dashboard') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Dashboard
        </Link>
        
        {(role === 'platform_admin' || role === 'store_manager') && (
          <Link 
            to="/store" 
            className={`px-3 py-2 rounded-md ${location.pathname.includes('/store') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
          >
            Store
          </Link>
        )}
        
        <Link 
          to="/shop" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/shop') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Shop
        </Link>
      </>
    );
  } else {
    // Regular end user navigation
    return (
      <>
        <Link 
          to="/store-selection" 
          className={`px-3 py-2 rounded-md flex items-center ${location.pathname.includes('/store-selection') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          <Home size={18} className="mr-1" /> Home
        </Link>
        
        <Link 
          to="/shop" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/shop') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Shop
        </Link>
        
        <Link 
          to="/profile" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/profile') && !location.search.includes('tab=purchases') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Profile
        </Link>
        
        <Link 
          to="/profile?tab=purchases" 
          className={`px-3 py-2 rounded-md ${location.pathname.includes('/profile') && location.search.includes('tab=purchases') ? 'text-sodap-purple font-medium' : 'text-gray-600 hover:text-sodap-purple'}`}
        >
          Purchase History
        </Link>
      </>
    );
  }
};

export default NavigationLinks;
