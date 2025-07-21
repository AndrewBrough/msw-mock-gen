export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'viewer';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
} 