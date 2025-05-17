
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StatCardProps = {
  stats: Array<{
    title: string;
    value: string;
    icon?: React.ReactNode;
  }>;
};

const StatCards: React.FC<StatCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2 flex flex-row items-center">
            {stat.icon}
            <CardTitle className={`text-sm font-medium text-gray-500 ${stat.icon ? 'ml-2' : ''}`}>
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
