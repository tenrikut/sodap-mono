"use client";

import React from "react";
import ProductManagement from "@/components/ProductManagement";
import { Box, Heading } from "@chakra-ui/react";
import "../../globals.css";

export default function AdminProductsPage() {
  return (
    <Box maxW="container.xl" mx="auto" py={8}>
      <Heading mb={6}>Admin Dashboard - Products</Heading>
      <ProductManagement />
    </Box>
  );
}
