
import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded-md bg-gradient-sodap"></div>
      <span className="text-xl font-bold text-sodap-purple">SoDap</span>
    </Link>
  );
};

export default Logo;
