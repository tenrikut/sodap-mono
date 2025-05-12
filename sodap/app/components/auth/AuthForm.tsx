import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
} from "@chakra-ui/react";
import { createNewWallet } from "utils/solana";

const AuthForm: React.FC = () => {
  const { register, login, resetPassword, loading, error } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [walletInfo, setWalletInfo] = useState<{
    publicKey: string;
    secretKey: number[];
  } | null>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoginFailed(false);
    try {
      if (mode === "register") {
        const wallet = createNewWallet();
        setWalletInfo({
          publicKey: wallet.publicKey,
          secretKey: wallet.secretKey,
        });
        await register(email, password);
        setMessage(
          "Registration successful! Please check your email to confirm. Your new wallet has been created."
        );
      } else if (mode === "login") {
        await login(email, password);
        setMessage("Login successful!");
      } else if (mode === "reset") {
        await resetPassword(email);
        setMessage("Password reset email sent!");
      }
    } catch (e) {
      if (mode === "login") setLoginFailed(true);
      toast({
        title: "Auth error",
        description: (e as Error).message,
        status: "error",
      });
    }
  };

  return (
    <Box maxW="sm" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      {mode === "login" && (
        <>
          <Heading size="md" mb={4} textAlign="center">
            Login to SoDap
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <Text color="red.500">{error.message}</Text>}
              {message && <Text color="green.500">{message}</Text>}
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                w="full"
              >
                Login
              </Button>
            </VStack>
          </form>
          <VStack spacing={2} mt={4}>
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => setMode("register")}
            >
              New user? Register
            </Button>
            {loginFailed && (
              <Button
                variant="link"
                colorScheme="blue"
                onClick={() => setMode("reset")}
              >
                Forgot password?
              </Button>
            )}
          </VStack>
        </>
      )}
      {mode === "register" && (
        <>
          <Heading size="md" mb={4} textAlign="center">
            Register New Account
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <Text color="red.500">{error.message}</Text>}
              {message && <Text color="green.500">{message}</Text>}
              <Button
                type="submit"
                colorScheme="green"
                isLoading={loading}
                w="full"
              >
                Register
              </Button>
            </VStack>
          </form>
          {walletInfo && (
            <Box mt={6} p={4} borderWidth={1} borderRadius="md" bg="yellow.50">
              <Heading size="sm" mb={2} color="yellow.700">
                Your New Wallet
              </Heading>
              <Text fontWeight="bold">Public Address:</Text>
              <Text mb={2} fontFamily="mono" fontSize="sm">
                {walletInfo.publicKey}
              </Text>
              <Text fontWeight="bold" color="red.600">
                Secret Key (Back Up Now!):
              </Text>
              <Text mb={2} fontFamily="mono" fontSize="xs" color="red.600">
                {JSON.stringify(walletInfo.secretKey)}
              </Text>
              <Text color="red.500" fontWeight="bold">
                Save your secret key securely. If you lose it, you will lose
                access to your wallet and funds!
              </Text>
            </Box>
          )}
          <VStack spacing={2} mt={4}>
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => setMode("login")}
            >
              Back to Login
            </Button>
          </VStack>
        </>
      )}
      {mode === "reset" && (
        <>
          <Heading size="md" mb={4} textAlign="center">
            Reset Password
          </Heading>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <Text color="red.500">{error.message}</Text>}
              {message && <Text color="green.500">{message}</Text>}
              <Button
                type="submit"
                colorScheme="orange"
                isLoading={loading}
                w="full"
              >
                Send Reset Email
              </Button>
            </VStack>
          </form>
          <VStack spacing={2} mt={4}>
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => setMode("login")}
            >
              Back to Login
            </Button>
          </VStack>
        </>
      )}
    </Box>
  );
};

export default AuthForm;
