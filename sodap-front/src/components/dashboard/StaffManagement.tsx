
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Edit, UserCheck, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Mock data for staff members
const initialStaff = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Cashier', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Inventory Manager', status: 'active' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Customer Service', status: 'inactive' },
];

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: '' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (id: string) => {
    setStaff(staff.map(member => 
      member.id === id 
      ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' } 
      : member
    ));
  };

  const handleAddStaff = () => {
    if (newStaff.name && newStaff.email && newStaff.role) {
      const newId = (staff.length + 1).toString();
      setStaff([...staff, { 
        id: newId, 
        name: newStaff.name, 
        email: newStaff.email, 
        role: newStaff.role,
        status: 'active' 
      }]);
      setNewStaff({ name: '', email: '', role: '' });
      setDialogOpen(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Staff Management</CardTitle>
        <div className="flex gap-2">
          <Input 
            placeholder="Search staff..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sodap-purple hover:bg-purple-700">
                <UserPlus className="mr-2 h-4 w-4" /> Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={newStaff.name} 
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newStaff.email} 
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role" 
                    value={newStaff.role} 
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddStaff} className="bg-sodap-purple hover:bg-purple-700">
                  Add Staff
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="py-3">{member.name}</td>
                  <td className="py-3">{member.email}</td>
                  <td className="py-3">{member.role}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleToggleStatus(member.id)}
                      className={member.status === 'active' ? 'text-red-500' : 'text-green-500'}
                    >
                      {member.status === 'active' 
                        ? <UserX className="h-4 w-4" /> 
                        : <UserCheck className="h-4 w-4" />
                      }
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffManagement;
