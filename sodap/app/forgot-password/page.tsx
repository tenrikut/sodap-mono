"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
} from "@chakra-ui/react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      toast({
        title: "Success",
        description: "Password reset email sent. Please check your inbox.",
        status: "success",
        duration: 5000,
      });

      router.push("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <VStack spacing={6}>
        <Heading size="lg">Forgot Your Password?</Heading>
        <Text>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              width="full"
              isLoading={loading}
            >
              Send Reset Link
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}
