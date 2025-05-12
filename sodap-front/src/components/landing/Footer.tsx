
import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  
  return (
    <footer className="bg-gray-50 py-10 border-t">
      <div className="container mx-auto px-4 text-center text-gray-600">
        {isDashboard ? (
          <p>© 2025 SoDap Teams</p>
        ) : (
          <p>© 2025 SoDap - Blockchain Shopping Platform, all rights reserved.</p>
        )}
      </div>
    </footer>
  );
};

export default Footer;
