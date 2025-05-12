import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getLoyaltyPointBalance } from "../utils/program-interface";

interface LoyaltyDisplayProps {
  storePublicKey: string | PublicKey;
  refreshTrigger?: number; // Optional prop to trigger refresh after transactions
}

/**
 * Component to display a user's loyalty point balance
 * Users can only view their points, not modify them directly
 */
export function LoyaltyDisplay({
  storePublicKey,
  refreshTrigger = 0,
}: LoyaltyDisplayProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch loyalty balance when wallet or store changes, or when refreshTrigger changes
  useEffect(() => {
    if (!wallet.publicKey || !storePublicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      if (!wallet.publicKey || !storePublicKey) {
        setBalance(null);
        return;
      }
      try {
        const loyaltyBalance = await getLoyaltyPointBalance(
          connection,
          wallet.publicKey,
          storePublicKey
        );

        setBalance(loyaltyBalance);
      } catch (err) {
        console.error("Error fetching loyalty balance:", err);
        setError("Unable to fetch loyalty balance");
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [wallet.publicKey, storePublicKey, connection, refreshTrigger]);

  // Calculate tier based on points
  const getTier = (points: number) => {
    if (points >= 100) return { name: "Platinum", color: "#e5e4e2" };
    if (points >= 50) return { name: "Gold", color: "#FFD700" };
    if (points >= 20) return { name: "Silver", color: "#C0C0C0" };
    return { name: "Bronze", color: "#cd7f32" };
  };

  // If not connected, show connect prompt
  if (!wallet.connected) {
    return (
      <div className="loyalty-display not-connected">
        <h3>Loyalty Program</h3>
        <p>Connect your wallet to view your loyalty points</p>

        <style jsx>{`
          .loyalty-display {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            max-width: 350px;
            margin: 0 auto;
          }
          h3 {
            margin-top: 0;
            color: #333;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="loyalty-display">
      <h3>Your Loyalty Points</h3>

      {loading ? (
        <div className="loading-state">
          <p>Loading your loyalty balance...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : balance !== null ? (
        <div className="balance-info">
          <div className="point-display">
            <span className="point-value">{balance}</span>
            <span className="point-label">points</span>
          </div>

          {balance > 0 && (
            <div
              className="tier-badge"
              style={{ backgroundColor: getTier(balance).color }}
            >
              {getTier(balance).name} Member
            </div>
          )}

          <div className="loyalty-rules">
            <h4>How it works:</h4>
            <ul>
              <li>Earn 1 point for every 1 SOL spent</li>
              <li>Points are automatically added to your balance</li>
              <li>Loyalty points cannot be transferred to other users</li>
              <li>Check back soon for redemption options!</li>
            </ul>
          </div>
        </div>
      ) : (
        <p>
          You don't have any loyalty points yet. Make a purchase to start
          earning!
        </p>
      )}

      <style jsx>{`
        .loyalty-display {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          max-width: 350px;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        h3 {
          margin-top: 0;
          color: #333;
          text-align: center;
        }
        .loading-state,
        .error-state {
          text-align: center;
          padding: 20px 0;
        }
        .error-state {
          color: #e53935;
        }
        .balance-info {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .point-display {
          text-align: center;
          margin-bottom: 15px;
        }
        .point-value {
          font-size: 48px;
          font-weight: bold;
          color: #512da8;
        }
        .point-label {
          font-size: 16px;
          color: #666;
          margin-left: 5px;
        }
        .tier-badge {
          font-size: 14px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          margin-bottom: 15px;
          color: #333;
        }
        .loyalty-rules {
          margin-top: 20px;
          width: 100%;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        .loyalty-rules h4 {
          margin-top: 0;
          font-size: 16px;
        }
        .loyalty-rules ul {
          margin: 0;
          padding-left: 20px;
        }
        .loyalty-rules li {
          margin-bottom: 5px;
          font-size: 14px;
          color: #555;
        }
      `}</style>
    </div>
  );
}
