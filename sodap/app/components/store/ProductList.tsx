"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Heading,
  useToast,
} from "@chakra-ui/react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error fetching products",
        description: (error as Error).message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast({
        title: "Product deleted successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error deleting product",
        description: (error as Error).message,
        status: "error",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Products
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th isNumeric>Price</Th>
            <Th isNumeric>Inventory</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product.id}>
              <Td>{product.name}</Td>
              <Td>{product.description}</Td>
              <Td isNumeric>{product.price} SOL</Td>
              <Td isNumeric>{product.inventory}</Td>
              <Td>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  Delete
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
