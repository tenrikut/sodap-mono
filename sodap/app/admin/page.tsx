import Link from "next/link";
import { Box, VStack, Heading, Link as ChakraLink } from "@chakra-ui/react";

export default function AdminPage() {
  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={4}>
        Admin Dashboard
      </Heading>
      <VStack align="stretch" spacing={4}>
        <ChakraLink as={Link} href="/admin/platform-admins" color="blue.500">
          Platform Admin Management
        </ChakraLink>
        <ChakraLink as={Link} href="/admin/products" color="blue.500">
          Product Management
        </ChakraLink>
        <ChakraLink as={Link} href="/admin/store-owners" color="blue.500">
          Store Owner Management
        </ChakraLink>
        <ChakraLink as={Link} href="/admin/store-admins" color="blue.500">
          Store Admin Management
        </ChakraLink>
      </VStack>
    </Box>
  );
}
