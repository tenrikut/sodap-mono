"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Badge,
  Text,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";

// Mock data for store admins
const initialStoreAdmins = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    storeId: "store1",
    storeName: "Fashion Outlet",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    storeId: "store2",
    storeName: "Tech Haven",
    role: "editor",
    status: "active",
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    storeId: "store3",
    storeName: "Home Goods",
    role: "viewer",
    status: "inactive",
  },
];

// Mock data for stores
const stores = [
  { id: "store1", name: "Fashion Outlet" },
  { id: "store2", name: "Tech Haven" },
  { id: "store3", name: "Home Goods" },
  { id: "store4", name: "Sports Center" },
  { id: "store5", name: "Jewelry Boutique" },
];

type StoreAdmin = {
  id: string;
  name: string;
  email: string;
  storeId: string;
  storeName: string;
  role: string;
  status: string;
};

export default function StoreAdminsPage() {
  const [storeAdmins, setStoreAdmins] = useState<StoreAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<StoreAdmin | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    storeId: "",
    role: "admin",
    status: "active",
  });

  // Load store admins (mock data for now)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStoreAdmins(initialStoreAdmins);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      storeId: "",
      role: "admin",
      status: "active",
    });
    setCurrentAdmin(null);
    setIsEditing(false);
  };

  const handleOpenModal = (admin: StoreAdmin | null = null) => {
    if (admin) {
      // Edit mode
      setCurrentAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        storeId: admin.storeId,
        role: admin.role,
        status: admin.status,
      });
      setIsEditing(true);
    } else {
      // Create mode
      resetForm();
      setIsEditing(false);
    }
    onOpen();
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.storeId) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isEditing && currentAdmin) {
      // Update existing admin
      const updatedAdmins = storeAdmins.map((admin) =>
        admin.id === currentAdmin.id
          ? {
              ...admin,
              name: formData.name,
              email: formData.email,
              storeId: formData.storeId,
              storeName: stores.find((store) => store.id === formData.storeId)?.name || "",
              role: formData.role,
              status: formData.status,
            }
          : admin
      );
      setStoreAdmins(updatedAdmins);
      toast({
        title: "Success",
        description: "Store admin updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create new admin
      const newAdmin: StoreAdmin = {
        id: `${storeAdmins.length + 1}`,
        name: formData.name,
        email: formData.email,
        storeId: formData.storeId,
        storeName: stores.find((store) => store.id === formData.storeId)?.name || "",
        role: formData.role,
        status: formData.status,
      };
      setStoreAdmins([...storeAdmins, newAdmin]);
      toast({
        title: "Success",
        description: "Store admin created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }

    handleCloseModal();
  };

  const handleDelete = (adminId: string) => {
    if (confirm("Are you sure you want to delete this store admin?")) {
      const updatedAdmins = storeAdmins.filter((admin) => admin.id !== adminId);
      setStoreAdmins(updatedAdmins);
      toast({
        title: "Success",
        description: "Store admin deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="lg">Store Admin Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="purple"
          onClick={() => handleOpenModal()}
        >
          Add Store Admin
        </Button>
      </Flex>

      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Store</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {storeAdmins.map((admin) => (
                <Tr key={admin.id}>
                  <Td>{admin.name}</Td>
                  <Td>{admin.email}</Td>
                  <Td>{admin.storeName}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        admin.role === "admin"
                          ? "purple"
                          : admin.role === "editor"
                          ? "blue"
                          : "gray"
                      }
                    >
                      {admin.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={admin.status === "active" ? "green" : "red"}
                    >
                      {admin.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleOpenModal(admin)}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(admin.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? "Edit Store Admin" : "Add Store Admin"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Store</FormLabel>
                <Select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleInputChange}
                  placeholder="Select store"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleSubmit}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
