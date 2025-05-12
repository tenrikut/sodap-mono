"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.push("/login");
    } else {
      setToken(token);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Password has been reset successfully",
        status: "success",
        duration: 3000,
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

  if (!token) {
    return null;
  }

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <VStack spacing={6}>
        <Heading size="lg">Reset Your Password</Heading>
        <Text>Please enter your new password below.</Text>
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>New Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              width="full"
              isLoading={loading}
            >
              Reset Password
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}
