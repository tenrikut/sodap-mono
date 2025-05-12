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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { SodapContext } from "@/contexts/SodapContext";
import { registerStoreOnChain, fetchStores, PROGRAM_ID } from "@/utils/solana";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";

const StoreOwnerManagement: React.FC = () => {
  const toast = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [logoUri, setLogoUri] = useState("");
  const [ownerWallet, setOwnerWallet] = useState("");
  const [registering, setRegistering] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const { userRole, wallet, platformAdmins } = useContext(SodapContext);

  // Only allow Platform Admins
  if (userRole !== "platform_admin") {
    return (
      <Box maxW="lg" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
        <Heading size="md" mb={4}>
          Access Denied
        </Heading>
        <Text>You must be a Platform Admin to access this page.</Text>
      </Box>
    );
  }

  // Helper to get Anchor program instance
  const getAnchorProgram = async () => {
    const connection = await web3.Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
    );
    const provider = new AnchorProvider(connection, wallet, {});
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const idl = require("../../target/idl/sodap.json");
    return new Program(idl, PROGRAM_ID, provider);
  };

  // Fetch stores from chain
  const loadStores = async () => {
    try {
      const program = await getAnchorProgram();
      const stores = await fetchStores(program);
      setStores(stores);
    } catch (e) {
      toast({ title: "Failed to fetch stores", status: "error" });
    }
  };

  useEffect(() => {
    loadStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler to register a new store owner
  const handleRegisterStore = async () => {
    setRegistering(true);
    try {
      const program = await getAnchorProgram();
      // For demo: use a local keypair for the owner (replace with real wallet logic)
      const ownerKeypair = web3.Keypair.generate();
      await registerStoreOnChain(
        program,
        ownerKeypair,
        storeName,
        storeDesc,
        logoUri
      );
      toast({ title: "Store Owner registered", status: "success" });
      setStoreName("");
      setStoreDesc("");
      setLogoUri("");
      setOwnerWallet("");
      await loadStores();
    } catch (e) {
      toast({ title: "Failed to register store", status: "error" });
    }
    setRegistering(false);
  };

  return (
    <Box maxW="lg" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={4}>
        Store Owner Management
      </Heading>
      <VStack align="stretch" spacing={4} mb={6}>
        <Input
          placeholder="Store Name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
        <Input
          placeholder="Store Description"
          value={storeDesc}
          onChange={(e) => setStoreDesc(e.target.value)}
        />
        <Input
          placeholder="Logo URI (optional)"
          value={logoUri}
          onChange={(e) => setLogoUri(e.target.value)}
        />
        <Input
          placeholder="Store Owner Wallet Address"
          value={ownerWallet}
          onChange={(e) => setOwnerWallet(e.target.value)}
        />
        <Button
          colorScheme="green"
          onClick={handleRegisterStore}
          isLoading={registering}
        >
          Register Store Owner
        </Button>
      </VStack>
      <Heading size="sm" mb={2}>
        Registered Stores
      </Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Owner Wallet</Th>
            <Th>Created At</Th>
          </Tr>
        </Thead>
        <Tbody>
          {stores.map((store, idx) => (
            <Tr key={idx}>
              <Td>{store.name}</Td>
              <Td>{store.ownerWallet}</Td>
              <Td>{new Date(store.createdAt).toLocaleString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default StoreOwnerManagement;
