import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  Button,
  HStack,
  VStack,
  Badge,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { fetchAndParseProgramEvents } from "@/utils/solana";

const eventTypes = [
  "All",
  "CartPurchased",
  "ProductPurchased",
  "LoyaltyPointsRedeemed",
  "ProductRegistered",
  "ProductUpdated",
  "ProductDeactivated",
];
const statusTypes = ["All", "Success", "Failed", "Pending"];
const anomalyTypes = [
  "All",
  "HighValue",
  "MultiplePurchases",
  "UnusualTime",
  "Other",
];

export default function TransactionsDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
    anomaly: "All",
    search: "",
  });
  const toast = useToast();

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAndParseProgramEvents(50);
        setEvents(data);
      } catch (e: any) {
        setError("Failed to fetch events from Solana RPC");
        toast({ title: "Error", description: e.message, status: "error" });
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [toast]);

  // Filtering logic
  const filteredEvents = events.filter((e) => {
    return (
      (filters.type === "All" ||
        e.event === filters.type ||
        e.type === filters.type) &&
      (filters.status === "All" || e.status === filters.status) &&
      (filters.anomaly === "All" ||
        (filters.anomaly === "None"
          ? !e.anomaly
          : e.anomaly === filters.anomaly)) &&
      (filters.search === "" ||
        (e.buyer &&
          e.buyer.toLowerCase().includes(filters.search.toLowerCase())) ||
        (e.store &&
          e.store.toLowerCase().includes(filters.search.toLowerCase())))
    );
  });

  // Export to CSV
  const exportCSV = () => {
    const header =
      "Type,Status,Anomaly,Buyer,Store,Amount,Timestamp,Signature\n";
    const rows = filteredEvents
      .map(
        (e) =>
          `${e.event || e.type},${e.status || ""},${e.anomaly || ""},${
            e.buyer || ""
          },${e.store || ""},${e.amount || ""},${
            e.timestamp || e.blockTime
              ? new Date(e.timestamp || e.blockTime * 1000).toISOString()
              : ""
          },${e.signature || ""}`
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box maxW="container.xl" mx="auto" py={8}>
      <Heading mb={6}>Transaction Monitoring & Analytics</Heading>
      <VStack align="stretch" spacing={4} mb={4}>
        <HStack>
          <Select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value }))
            }
            w="200px"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            w="150px"
          >
            {statusTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={filters.anomaly}
            onChange={(e) =>
              setFilters((f) => ({ ...f, anomaly: e.target.value }))
            }
            w="200px"
          >
            {anomalyTypes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Search by buyer/store"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            w="250px"
          />
          <Button colorScheme="blue" onClick={exportCSV}>
            Export CSV
          </Button>
        </HStack>
      </VStack>
      {loading ? (
        <HStack justify="center" py={10}>
          <Spinner size="xl" /> <Box>Loading events from Solana...</Box>
        </HStack>
      ) : error ? (
        <Box color="red.500">{error}</Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Anomaly</Th>
              <Th>Buyer</Th>
              <Th>Store</Th>
              <Th isNumeric>Amount (SOL)</Th>
              <Th>Timestamp</Th>
              <Th>Signature</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredEvents.map((e, i) => (
              <Tr key={i}>
                <Td>{e.event || e.type}</Td>
                <Td>
                  <Badge
                    colorScheme={
                      e.status === "Success"
                        ? "green"
                        : e.status === "Failed"
                        ? "red"
                        : "yellow"
                    }
                  >
                    {e.status || "-"}
                  </Badge>
                </Td>
                <Td>
                  {e.anomaly ? (
                    <Badge colorScheme="red">{e.anomaly}</Badge>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td>{e.buyer || "-"}</Td>
                <Td>{e.store || "-"}</Td>
                <Td isNumeric>{e.amount || "-"}</Td>
                <Td>
                  {e.timestamp
                    ? new Date(e.timestamp).toLocaleString()
                    : e.blockTime
                    ? new Date(e.blockTime * 1000).toLocaleString()
                    : "-"}
                </Td>
                <Td
                  fontSize="xs"
                  maxW="120px"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {e.signature || "-"}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {filteredEvents.length === 0 && !loading && (
        <Box mt={4}>No transactions found.</Box>
      )}
    </Box>
  );
}
