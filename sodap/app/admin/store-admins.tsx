import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { SodapContext } from "@/contexts/SodapContext";
import { fetchStores, addStoreAdminOnChain, PROGRAM_ID } from "@/utils/solana";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";

const StoreAdminManagement: React.FC = () => {
  const toast = useToast();
  const { userRole, wallet } = useContext(SodapContext);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [adminWallet, setAdminWallet] = useState("");
  const [roleType, setRoleType] = useState("Manager");
  const [adding, setAdding] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]); // Replace with real type

  // Only allow Store Owners
  if (userRole !== "store_owner") {
    return (
      <Box maxW="lg" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
        <Heading size="md" mb={4}>
          Access Denied
        </Heading>
        <Text>You must be a Store Owner to access this page.</Text>
      </Box>
    );
  }

  // Fetch stores where user is owner
  useEffect(() => {
    const loadStores = async () => {
      try {
        const connection = await web3.Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
            "https://api.devnet.solana.com"
        );
        const provider = new AnchorProvider(connection, wallet, {});
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const idl = require("../../target/idl/sodap.json");
        const program = new Program(idl, PROGRAM_ID, provider);
        const allStores = await fetchStores(program);
        // Filter stores where owner matches current wallet
        setStores(
          allStores.filter((s: any) => s.owner === wallet.publicKey.toBase58())
        );
      } catch (e) {
        toast({ title: "Failed to fetch stores", status: "error" });
      }
    };
    if (wallet && wallet.publicKey) loadStores();
  }, [wallet]);

  // Fetch admins for selected store (stub)
  useEffect(() => {
    if (selectedStore) {
      // TODO: Fetch real admins from chain
      setAdmins([
        { wallet: "admin1pubkey", role: "Manager" },
        { wallet: "admin2pubkey", role: "Cashier" },
      ]);
    } else {
      setAdmins([]);
    }
  }, [selectedStore]);

  // Handler to add admin (on-chain)
  const handleAddAdmin = async () => {
    setAdding(true);
    try {
      const connection = await web3.Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com"
      );
      const provider = new AnchorProvider(connection, wallet, {});
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const idl = require("../../target/idl/sodap.json");
      const program = new Program(idl, PROGRAM_ID, provider);
      const ownerKeypair = wallet; // Use wallet as owner signer
      await addStoreAdminOnChain(
        program,
        ownerKeypair,
        new web3.PublicKey(selectedStore),
        new web3.PublicKey(adminWallet),
        roleType
      );
      setAdmins((prev) => [...prev, { wallet: adminWallet, role: roleType }]);
      setAdminWallet("");
      setRoleType("Manager");
      toast({ title: "Store Admin added", status: "success" });
    } catch (e) {
      toast({ title: "Failed to add admin", status: "error" });
    }
    setAdding(false);
  };

  return (
    <Box maxW="lg" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={4}>
        Store Admin Management
      </Heading>
      <VStack align="stretch" spacing={4} mb={6}>
        <Select
          placeholder="Select Store"
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
        >
          {stores.map((store) => (
            <option key={store.storeId} value={store.storeId}>
              {store.name}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Admin Wallet Address"
          value={adminWallet}
          onChange={(e) => setAdminWallet(e.target.value)}
        />
        <Select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
          <option value="Manager">Manager</option>
          <option value="Cashier">Cashier</option>
        </Select>
        <Button
          colorScheme="blue"
          onClick={handleAddAdmin}
          isLoading={adding}
          isDisabled={!selectedStore || !adminWallet}
        >
          Add Store Admin
        </Button>
      </VStack>
      <Heading size="sm" mb={2}>
        Current Admins
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Wallet</Th>
            <Th>Role</Th>
          </Tr>
        </Thead>
        <Tbody>
          {admins.map((admin, idx) => (
            <Tr key={idx}>
              <Td>{admin.wallet}</Td>
              <Td>{admin.role}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default StoreAdminManagement;
