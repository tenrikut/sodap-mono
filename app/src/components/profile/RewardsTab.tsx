
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock purchase history
const mockPurchaseHistory = [
  {
    id: "pur_123456",
    date: "2025-05-08",
    store: "Electronics Emporium",
    items: ["Wireless Earbuds", "Phone Charger"],
    total: "1.45 SOL",
  },
  {
    id: "pur_123457",
    date: "2025-05-01",
    store: "Digital Decor",
    items: ["Smart Light Bulb"],
    total: "0.75 SOL",
  },
  {
    id: "pur_123458",
    date: "2025-04-22",
    store: "Fashion Forward",
    items: ["T-Shirt", "Jeans", "Hat"],
    total: "2.30 SOL",
  },
];

const RewardsTab: React.FC = () => {
  const { userProfile } = useProfile();
  const [redeemAmount, setRedeemAmount] = useState<number>(10);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  
  const handleRedeemPoints = () => {
    setIsRedeeming(true);
    
    // Simulate redeeming points with a timeout
    setTimeout(() => {
      // In a real app, this would call your blockchain logic
      toast({
        title: "Points Redeemed",
        description: `You have successfully redeemed ${redeemAmount} points!`,
      });
      setIsRedeeming(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earn Rewards</CardTitle>
        <p className="text-gray-500">Your rewards wallet was created automatically when you registered.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Loyalty Points Balance</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-sodap text-white px-6 py-3 rounded-full font-bold text-lg">
              {userProfile.loyaltyPoints} points
            </div>
            <span className="text-gray-500">≈ {(userProfile.loyaltyPoints / 100).toFixed(2)} SOL value</span>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="bg-sodap-purple hover:bg-sodap-purple/90"
                disabled={userProfile.loyaltyPoints < 10}
              >
                Redeem Points
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Redeem Loyalty Points</DialogTitle>
                <DialogDescription>
                  Choose how many points you would like to redeem.
                  You have {userProfile.loyaltyPoints} points available.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <label htmlFor="points" className="block text-sm font-medium mb-2">
                  Points to Redeem (minimum 10)
                </label>
                <input
                  id="points"
                  type="number"
                  min={10}
                  max={userProfile.loyaltyPoints}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(Math.max(10, Math.min(userProfile.loyaltyPoints, parseInt(e.target.value))))}
                  className="w-full p-2 border rounded"
                />
                
                <div className="mt-2 text-sm text-gray-500">
                  Value: ~{(redeemAmount / 100).toFixed(2)} SOL
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  className="bg-sodap-purple hover:bg-sodap-purple/90"
                  onClick={handleRedeemPoints}
                  disabled={isRedeeming || redeemAmount < 10 || redeemAmount > userProfile.loyaltyPoints}
                >
                  {isRedeeming ? "Processing..." : "Confirm Redemption"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {userProfile.loyaltyPoints < 10 && (
            <p className="text-sm text-gray-500 mt-2">
              You need at least 10 points to redeem rewards.
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-4">Latest Rewards Earned</h3>
          {mockPurchaseHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Points Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseHistory.slice(0, 3).map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.date}</TableCell>
                    <TableCell>{purchase.store}</TableCell>
                    <TableCell>
                      +{Math.floor(parseFloat(purchase.total) * 100)} points
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">No rewards earned yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsTab;
