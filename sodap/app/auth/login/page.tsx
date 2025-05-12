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
  Text,
  Link as ChakraLink,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      toast({
        title: "Login successful",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Box 
          maxW="md" 
          mx="auto" 
          p={8} 
          borderWidth="1px" 
          borderRadius="xl" 
          boxShadow="xl"
          bg="white"
          borderColor="purple.100"
          className="backdrop-blur-sm bg-white/90"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
          </div>
          
          <Heading size="lg" mb={6} textAlign="center" color="purple.800">
            Welcome Back
          </Heading>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontWeight="medium" color="gray.700">Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  size="lg"
                  borderRadius="md"
                  borderColor="purple.200"
                  _hover={{ borderColor: "purple.300" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontWeight="medium" color="gray.700">Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    borderRadius="md"
                    borderColor="purple.200"
                    _hover={{ borderColor: "purple.300" }}
                    _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          {showPassword ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      }
                      onClick={toggleShowPassword}
                      variant="ghost"
                      colorScheme="purple"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <div className="w-full flex justify-end">
                <ChakraLink 
                  as={Link} 
                  href="/forgot-password" 
                  color="purple.600"
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{ textDecoration: "underline" }}
                >
                  Forgot password?
                </ChakraLink>
              </div>

              <Button
                type="submit"
                colorScheme="purple"
                width="full"
                isLoading={loading}
                mt={4}
                size="lg"
                borderRadius="md"
                boxShadow="md"
                _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                transition="all 0.2s"
              >
                Sign In
              </Button>

              <Text mt={4} textAlign="center" color="gray.600">
                Don't have an account?{" "}
                <ChakraLink 
                  as={Link} 
                  href="/auth/register" 
                  color="purple.600"
                  fontWeight="medium"
                  _hover={{ textDecoration: "underline" }}
                >
                  Create an account
                </ChakraLink>
              </Text>
            </VStack>
          </form>
        </Box>
      </motion.div>
    </div>
  );
}
