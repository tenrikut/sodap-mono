"use client";

import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
} from "@chakra-ui/react";

interface StoreSetupProps {
  onComplete?: () => void;
}

export default function StoreSetup({ onComplete }: StoreSetupProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/store/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error("Failed to create store");
      }

      toast({
        title: "Store created successfully",
        status: "success",
        duration: 3000,
      });

      setName("");
      setDescription("");
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Error creating store",
        description: (error as Error).message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <Heading size="lg" mb={6}>
        Set Up Your Store
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Store Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter store name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter store description"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="purple"
            width="full"
            isLoading={loading}
          >
            Create Store
          </Button>
        </VStack>
      </form>
    </Box>
  );
}
