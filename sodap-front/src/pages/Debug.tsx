import Layout from "@/components/layout/Layout";
import WalletDebugPanel from "@/components/debug/WalletDebugPanel";

const DebugPage = () => {
  return (
    <Layout role="end_user">
      <WalletDebugPanel />
    </Layout>
  );
};

export default DebugPage;
