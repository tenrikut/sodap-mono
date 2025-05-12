"use client";

import React from "react";
import Layout from "@/components/layout/Layout";
import { TransactionHistory } from "@/components/payment/TransactionHistory";
import { ProfileProvider } from "@/contexts/ProfileContext";

const TransactionsPage = () => {
  return (
    <Layout role="end_user">
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
        <div className="max-w-4xl mx-auto">
          <TransactionHistory />
        </div>
      </div>
    </Layout>
  );
};

// Wrapper component that provides the Profile context
const Transactions = () => {
  return (
    <ProfileProvider>
      <TransactionsPage />
    </ProfileProvider>
  );
};

export default Transactions;
