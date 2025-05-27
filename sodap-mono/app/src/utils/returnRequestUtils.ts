// Helper utilities for managing return requests in localStorage
import { ReturnRequest } from "@/hooks/useReturnRequests";

const STORAGE_KEY = "sodap-return-requests";

/**
 * Get all return requests from localStorage
 */
export const getReturnRequests = (): ReturnRequest[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing return requests from localStorage:", error);
    return [];
  }
};

/**
 * Save return requests to localStorage
 */
export const saveReturnRequests = (requests: ReturnRequest[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

    // Also update sessionStorage for backward compatibility
    sessionStorage.setItem("returnRequests", JSON.stringify(requests));

    // Dispatch update event
    window.dispatchEvent(new CustomEvent("refundRequestUpdate"));

    return true;
  } catch (error) {
    console.error("Error saving return requests to localStorage:", error);
    return false;
  }
};

/**
 * Update a specific return request
 */
export const updateReturnRequest = (
  requestId: string,
  updates: Partial<ReturnRequest>
): boolean => {
  try {
    const requests = getReturnRequests();
    const updatedRequests = requests.map((req) =>
      req.id === requestId ? { ...req, ...updates } : req
    );

    return saveReturnRequests(updatedRequests);
  } catch (error) {
    console.error("Error updating return request:", error);
    return false;
  }
};

/**
 * Add a new return request
 */
export const addReturnRequest = (request: ReturnRequest): boolean => {
  try {
    const requests = getReturnRequests();
    const updatedRequests = [...requests, request];

    return saveReturnRequests(updatedRequests);
  } catch (error) {
    console.error("Error adding return request:", error);
    return false;
  }
};

/**
 * Get processing requests (status === "Processing" and has refundSignature)
 */
export const getProcessingRequests = (): ReturnRequest[] => {
  return getReturnRequests().filter(
    (req) => req.status === "Processing" && req.refundSignature
  );
};

/**
 * Get pending requests (status === "Pending")
 */
export const getPendingRequests = (): ReturnRequest[] => {
  return getReturnRequests().filter((req) => req.status === "Pending");
};

/**
 * Mark a processing request as approved
 */
export const markRequestAsApproved = (requestId: string): boolean => {
  return updateReturnRequest(requestId, {
    status: "Approved",
    refundDate: new Date().toISOString(),
  });
};

/**
 * Mark a processing request as failed (reset to pending)
 */
export const markRequestAsFailed = (requestId: string): boolean => {
  return updateReturnRequest(requestId, {
    status: "Pending",
    refundSignature: undefined,
    refundDate: undefined,
  });
};

/**
 * Mark a request as processing with transaction signature
 */
export const markRequestAsProcessing = (
  requestId: string,
  refundSignature: string
): boolean => {
  return updateReturnRequest(requestId, {
    status: "Processing",
    refundSignature,
    refundDate: new Date().toISOString(),
  });
};
