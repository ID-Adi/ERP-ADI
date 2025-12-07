'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';

// Dummy data
const dummyContacts = [
  {
    id: '1',
    code: 'CUST-00001',
    name: 'PT Maju Jaya',
    type: 'CUSTOMER',
    email: 'info@majujaya.com',
    phone: '021-1234567',
    city: 'Jakarta',
    isActive: true,
  },
  {
    id: '2',
    code: 'CUST-00002',
    name: 'CV Berkah Sejahtera',
    type: 'CUSTOMER',
    email: 'berkah@example.com',
    phone: '022-9876543',
    city: 'Bandung',
    isActive: true,
  },
  {
    id: '3',
    code: 'VEND-00001',
    name: 'PT Supplier Indonesia',
    type: 'VENDOR',
    email: 'supplier@example.com',
    phone: '021-5555555',
    city: 'Jakarta',
    isActive: true,
  },
  {
    id: '4',
    code: 'CUST-00003',
    name: 'UD Sentosa',
    type: 'BOTH',
    email: 'sentosa@example.com',
    phone: '031-4444444',
    city: 'Surabaya',
    isActive: false,
  },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState(dummyContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contactId?: string }>({
    isOpen: false,
  });

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || contact.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleDelete = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setDeleteModal({ isOpen: false });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage your customers and vendors</p>
        </div>
        <Link href="/dashboard/masters/contacts/new">
          <Button variant="primary" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Types</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-3">
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <span className="font-medium text-primary-600">{contact.code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900">{contact.name}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        contact.type === 'CUSTOMER'
                          ? 'bg-blue-100 text-blue-800'
                          : contact.type === 'VENDOR'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {contact.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">{contact.email}</TableCell>
                  <TableCell className="text-gray-600">{contact.phone}</TableCell>
                  <TableCell className="text-gray-600">{contact.city}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        contact.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/masters/contacts/${contact.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/masters/contacts/${contact.id}/edit`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-danger-600 hover:bg-danger-50"
                        onClick={() => setDeleteModal({ isOpen: true, contactId: contact.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal({ isOpen: false })}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteModal.contactId && handleDelete(deleteModal.contactId)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Deleting this contact will remove all associated data. Are you absolutely sure?
        </p>
      </Modal>
    </div>
  );
}
