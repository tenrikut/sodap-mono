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
  HStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });

      router.push("/auth/verify-email");
    } catch (error) {
      toast({
        title: "Registration failed",
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

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
        </div>
        
        <Heading size="lg" mb={6} textAlign="center" color="purple.800">
          Create an Account
        </Heading>
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={5}>
            <FormControl isInvalid={!!errors.username}>
              <FormLabel fontWeight="medium" color="gray.700">Username</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                size="lg"
                borderRadius="md"
                borderColor="purple.200"
                _hover={{ borderColor: "purple.300" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
              />
              <FormErrorMessage>{errors.username}</FormErrorMessage>
            </FormControl>

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
                  placeholder="Create a password"
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
              {!errors.password && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Password must be at least 8 characters
                </Text>
              )}
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel fontWeight="medium" color="gray.700">Confirm Password</FormLabel>
              <InputGroup size="lg">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  borderRadius="md"
                  borderColor="purple.200"
                  _hover={{ borderColor: "purple.300" }}
                  _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" }}
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                        {showConfirmPassword ? (
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
                    onClick={toggleShowConfirmPassword}
                    variant="ghost"
                    colorScheme="purple"
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="purple"
              width="full"
              isLoading={loading}
              mt={6}
              size="lg"
              borderRadius="md"
              boxShadow="md"
              _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
              transition="all 0.2s"
            >
              Create Account
            </Button>

            <Text mt={4} textAlign="center" color="gray.600">
              Already have an account?{" "}
              <ChakraLink 
                as={Link} 
                href="/auth/login" 
                color="purple.600"
                fontWeight="medium"
                _hover={{ textDecoration: "underline" }}
              >
                Sign in
              </ChakraLink>
            </Text>
          </VStack>
        </form>
      </motion.div>
    </Box>
  );
}
