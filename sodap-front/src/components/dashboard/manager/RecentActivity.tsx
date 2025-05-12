import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RecentActivity: React.FC = () => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 text-gray-500">
          <p>Activity data will be populated here from the Solana blockchain</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
