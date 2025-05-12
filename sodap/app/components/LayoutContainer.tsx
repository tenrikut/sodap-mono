"use client";
import { Box } from "@chakra-ui/react";
import { usePathname } from "next/navigation";

export default function LayoutContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";
  return isLoginPage ? (
    <>{children}</>
  ) : (
    <Box as="main" pt="70px" px={4} maxW="container.xl" mx="auto">
      {children}
    </Box>
  );
}
