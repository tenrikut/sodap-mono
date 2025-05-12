import React, { useState, useEffect, useContext } from "react";
import { SodapContext } from "@/contexts/SodapContext";
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Badge,
} from "@chakra-ui/react";
import { Product } from "@/types/sodap";

const ProductManagement: React.FC = () => {
  const { getProducts, addProduct, updateProduct, removeProduct } =
    useContext(SodapContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Form state for new product
  const [formData, setFormData] = useState<
    Omit<Product, "id"> & { id?: string }
  >({
    name: "",
    description: "",
    price: 0,
    inventory: 0,
    category: "",
    imageUrl: "",
    isActive: true,
    tokenizedType: "None",
  });

  // Mode for modal (add or edit)
  const [mode, setMode] = useState<"add" | "edit">("add");

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productList = await getProducts();
      setProducts(productList);
    } catch (error) {
      toast({
        title: "Error loading products",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    setFormData({
      ...formData,
      [name]: val,
    });
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked,
    });
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      inventory: 0,
      category: "",
      imageUrl: "",
      isActive: true,
      tokenizedType: "None",
    });
  };

  const openAddModal = () => {
    resetForm();
    setMode("add");
    onOpen();
  };

  const openEditModal = (product: Product) => {
    setFormData({
      ...product,
    });
    setMode("edit");
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (mode === "add") {
        await addProduct(formData);
        toast({
          title: "Product added",
          description: `Successfully added ${formData.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        if (!formData.id) return;

        await updateProduct(formData.id, formData);
        toast({
          title: "Product updated",
          description: `Successfully updated ${formData.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      // Refresh product list
      loadProducts();

      // Close modal
      onClose();
    } catch (error) {
      toast({
        title: `Error ${mode === "add" ? "adding" : "updating"} product`,
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await updateProduct(id, { isActive: false });
      toast({
        title: "Product deactivated",
        description: "The product has been deactivated successfully",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Error deactivating product",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={5}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Product Management</Heading>
        <Button colorScheme="blue" onClick={openAddModal}>
          Add New Product
        </Button>
      </HStack>

      {isLoading ? (
        <Text>Loading products...</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th isNumeric>Price (SOL)</Th>
              <Th isNumeric>Stock</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {products.map((product) => (
              <Tr key={product.id}>
                <Td>{product.name}</Td>
                <Td>{product.category || "Uncategorized"}</Td>
                <Td isNumeric>{product.price}</Td>
                <Td isNumeric>{product.inventory}</Td>
                <Td>
                  <Badge colorScheme={product.isActive ? "green" : "red"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="sm" onClick={() => openEditModal(product)}>
                      Edit
                    </Button>
                    {product.isActive && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeactivate(product.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Add/Edit Product Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {mode === "add" ? "Add New Product" : "Edit Product"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Product Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Product name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Product description"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  placeholder="Category"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Price (SOL)</FormLabel>
                <NumberInput
                  min={0.001}
                  step={0.01}
                  value={formData.price}
                  onChange={(value) =>
                    handleNumberChange("price", parseFloat(value))
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Stock Quantity</FormLabel>
                <NumberInput
                  min={0}
                  step={1}
                  value={formData.inventory}
                  onChange={(value) =>
                    handleNumberChange("inventory", parseInt(value))
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Image URL</FormLabel>
                <Input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleFormChange}
                  placeholder="https://..."
                />
              </FormControl>

              <FormControl>
                <FormLabel>Tokenized Type</FormLabel>
                <Select
                  name="tokenizedType"
                  value={formData.tokenizedType}
                  onChange={handleFormChange}
                >
                  <option value="None">None</option>
                  <option value="SplToken">SPL Token</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Active</FormLabel>
                <Switch
                  isChecked={formData.isActive}
                  onChange={handleSwitchChange}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {mode === "add" ? "Add Product" : "Update Product"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProductManagement;
