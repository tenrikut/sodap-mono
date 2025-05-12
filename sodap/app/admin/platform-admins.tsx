import React, { useContext, useState } from "react";
import { SodapContext } from "@/contexts/SodapContext";
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";

const PlatformAdminManagement: React.FC = () => {
  const {
    superRootAdmin,
    loginSuperRootAdmin,
    logoutSuperRootAdmin,
    platformAdmins,
    addPlatformAdmin,
    removePlatformAdmin,
  } = useContext(SodapContext);
  const toast = useToast();
  const [loginState, setLoginState] = useState({ username: "", password: "" });
  const [adding, setAdding] = useState(false);
  const [newAdminWallet, setNewAdminWallet] = useState("");
  const [loading, setLoading] = useState(false);

  // Login handler
  const handleLogin = async () => {
    setLoading(true);
    const success = await loginSuperRootAdmin(
      loginState.username,
      loginState.password
    );
    setLoading(false);
    if (!success) {
      toast({ title: "Login failed", status: "error" });
    }
  };

  // Add Platform Admin handler
  const handleAddAdmin = async () => {
    if (!newAdminWallet) return;
    setAdding(true);
    await addPlatformAdmin(
      { walletAddress: newAdminWallet, addedAt: Date.now() },
      superRootAdmin!.username,
      superRootAdmin!.password
    );
    setNewAdminWallet("");
    setAdding(false);
    toast({ title: "Platform Admin added", status: "success" });
  };

  // Remove Platform Admin handler
  const handleRemoveAdmin = async (walletAddress: string) => {
    await removePlatformAdmin(
      walletAddress,
      superRootAdmin!.username,
      superRootAdmin!.password
    );
    toast({ title: "Platform Admin removed", status: "info" });
  };

  if (!superRootAdmin) {
    return (
      <Box maxW="sm" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
        <Heading size="md" mb={4}>
          Super Root Admin Login
        </Heading>
        <VStack spacing={3}>
          <Input
            placeholder="Username"
            value={loginState.username}
            onChange={(e) =>
              setLoginState({ ...loginState, username: e.target.value })
            }
          />
          <Input
            placeholder="Password"
            type="password"
            value={loginState.password}
            onChange={(e) =>
              setLoginState({ ...loginState, password: e.target.value })
            }
          />
          <Button
            colorScheme="blue"
            onClick={handleLogin}
            isLoading={loading}
            w="full"
          >
            Login
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="lg" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Platform Admin Management</Heading>
        <Button
          onClick={logoutSuperRootAdmin}
          colorScheme="red"
          variant="outline"
        >
          Logout
        </Button>
      </HStack>
      <VStack align="stretch" spacing={4} mb={6}>
        <HStack>
          <Input
            placeholder="Platform Admin Wallet Address"
            value={newAdminWallet}
            onChange={(e) => setNewAdminWallet(e.target.value)}
          />
          <Button
            colorScheme="green"
            onClick={handleAddAdmin}
            isLoading={adding}
          >
            Add Admin
          </Button>
        </HStack>
      </VStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Wallet Address</Th>
            <Th>Added At</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {platformAdmins.map((admin) => (
            <Tr key={admin.walletAddress}>
              <Td>{admin.walletAddress}</Td>
              <Td>{new Date(admin.addedAt).toLocaleString()}</Td>
              <Td>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleRemoveAdmin(admin.walletAddress)}
                >
                  Remove
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PlatformAdminManagement;
