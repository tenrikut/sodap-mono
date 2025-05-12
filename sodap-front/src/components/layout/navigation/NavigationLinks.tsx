import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

interface NavigationLinksProps {
  isCartPage: boolean;
  isProfilePage: boolean;
  isStorePage: boolean;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({
  isCartPage,
  isProfilePage,
  isStorePage,
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
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/shop")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
        >
          Shop
        </Link>
        <Link
          to="/transactions"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/transactions")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
        >
          Transactions
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
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/profile")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
        >
          Profile
        </Link>
        <Link
          to="/transactions"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/transactions")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
        >
          Transactions
        </Link>
        <Link
          to="/shop"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/shop")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
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
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/dashboard")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/store"
          className={`px-3 py-2 rounded-md ${
            location.pathname.includes("/store")
              ? "text-sodap-purple font-medium"
              : "text-gray-600 hover:text-sodap-purple"
          }`}
        >
          Store
        </Link>
      </>
    );
  }

  // Default navigation for other pages
  return (
    <>
      <Link
        to="/dashboard"
        className={`px-3 py-2 rounded-md ${
          location.pathname.includes("/dashboard")
            ? "text-sodap-purple font-medium"
            : "text-gray-600 hover:text-sodap-purple"
        }`}
      >
        Dashboard
      </Link>

      <Link
        to="/store"
        className={`px-3 py-2 rounded-md ${
          location.pathname.includes("/store")
            ? "text-sodap-purple font-medium"
            : "text-gray-600 hover:text-sodap-purple"
        }`}
      >
        Store
      </Link>

      <Link
        to="/shop"
        className={`px-3 py-2 rounded-md ${
          location.pathname.includes("/shop")
            ? "text-sodap-purple font-medium"
            : "text-gray-600 hover:text-sodap-purple"
        }`}
      >
        Shop
      </Link>

      <Link
        to="/profile"
        className={`px-3 py-2 rounded-md ${
          location.pathname.includes("/profile")
            ? "text-sodap-purple font-medium"
            : "text-gray-600 hover:text-sodap-purple"
        }`}
      >
        Profile
      </Link>

      <Link
        to="/transactions"
        className={`px-3 py-2 rounded-md ${
          location.pathname.includes("/transactions")
            ? "text-sodap-purple font-medium"
            : "text-gray-600 hover:text-sodap-purple"
        }`}
      >
        Transactions
      </Link>
    </>
  );
};

export default NavigationLinks;
