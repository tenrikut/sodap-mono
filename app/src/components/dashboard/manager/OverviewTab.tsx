
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OverviewTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Weekly Sales Report</h3>
              <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Sales chart will be displayed here</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Top Selling Products</h3>
              <div className="space-y-2">
                {['SoDap T-Shirt', 'SoDap Mug', 'SoDap Sticker Pack'].map((product) => (
                  <div key={product} className="flex justify-between border-b pb-2">
                    <span>{product}</span>
                    <span className="font-medium">{Math.floor(Math.random() * 100)} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverviewTab;
