
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock store data - would be replaced with API call
const mockStores = [
  { id: '1', name: 'SoDap Official Store', location: 'San Francisco, CA' },
  { id: '2', name: 'Digital Collectibles', location: 'New York, NY' },
  { id: '3', name: 'Crypto Merchandise', location: 'Miami, FL' },
  { id: '4', name: 'Blockchain Apparel', location: 'Austin, TX' },
];

const StoreSelection: React.FC = () => {
  const [searchType, setSearchType] = useState<'id' | 'name'>('name');
  const [searchValue, setSearchValue] = useState('');
  const [filteredStores, setFilteredStores] = useState(mockStores);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!searchValue.trim()) {
      setFilteredStores(mockStores);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      let results;
      
      if (searchType === 'id') {
        results = mockStores.filter(store => 
          store.id.toLowerCase().includes(searchValue.toLowerCase())
        );
      } else {
        results = mockStores.filter(store => 
          store.name.toLowerCase().includes(searchValue.toLowerCase())
        );
      }

      setFilteredStores(results);
      setIsLoading(false);

      if (results.length === 0) {
        toast({
          title: "No stores found",
          description: `No stores found with that ${searchType}. Please try again.`,
        });
      }
    }, 500);
  };

  const handleStoreSelect = (storeId: string) => {
    // In a real app, you would store the selected store in context or state management
    toast({
      title: "Store Selected",
      description: `You've selected store #${storeId}`,
    });
    // Navigate to the shop with the store ID
    navigate(`/shop?store=${storeId}`);
  };

  return (
    <Layout role="end_user">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Select a Store</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <Select 
                  value={searchType} 
                  onValueChange={(value) => setSearchType(value as 'id' | 'name')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Store Name</SelectItem>
                    <SelectItem value="id">Store ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={searchType === 'id' ? "Enter store ID..." : "Enter store name..."}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch} 
                  variant="outline" 
                  className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
                  disabled={isLoading}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-semibold mb-4">Available Stores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStores.map(store => (
            <Card 
              key={store.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStoreSelect(store.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{store.name}</h3>
                    <p className="text-sm text-gray-600">ID: {store.id}</p>
                    <p className="text-sm text-gray-600">{store.location}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-sodap-purple text-sodap-purple hover:bg-sodap-purple/5"
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No stores found matching your search criteria. Please try again.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreSelection;
