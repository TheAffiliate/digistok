import { Models } from 'appwrite';

// 1. Users Collection
export interface User extends Models.Document {
  user_id: string;
  full_name: string;
  email: string;
  wallet_address: string;
  fica_status: 'pending' | 'verified' | 'rejected'; // Based on enum
  id_number?: string; 
}

// 2. Transactions Collection
export interface Transaction extends Models.Document {
  user_id: string;
  pool_id?: string;
  tx_type: 'yield' | 'deposit' | 'withdrawal'; // Based on enum
  amount_zar: number;
  amount_usdc?: number;
  tx_hash?: string;
  status: 'pending' | 'completed' | 'failed'; // Based on enum
}

// 3. Pools Collection
export interface Pool extends Models.Document {
  pool_id: string;
  contract_address?: string;
  name: string;
  description?: string;
  contribution_amount: number;
  rotation_interval: 'daily' | 'weekly' | 'monthly'; // Based on enum
  creator_id: string;
  status: 'active' | 'pending' | 'closed'; // Based on enum
  
  // NOTE: These were in your dashboard code but are missing from the DB screenshot
  total_value_locked?: number; 
  accumulated_yield?: number;
}

// 4. Memberships Collection
export interface Membership extends Models.Document {
  pool_id: string;
  user_id: string;
  role: 'admin' | 'member'; // Based on enum
  joined_at: string; // Datetime string
}

// 5. Invitations Collection
export interface Invitation extends Models.Document {
  pool_id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined'; // Based on enum
}

// 6. Deletion Governance Collection
export interface DeletionGovernance extends Models.Document {
  deletion_governance: string; // Note: You may have meant to name this 'pool_id' in Appwrite
  initiated_by: string;
  status?: string; // Enum
  votes_for: number;
  votes_against: number;
}

// 7. Pool Documents Collection
export interface PoolDocument extends Models.Document {
  pool_id: string;
  creator_id: string;
  contract_address?: string; // Web3 Smart Contract address
  name: string;
  description?: string;
  contribution_amount: number;
  rotation_interval: 'weekly' | 'monthly';
  max_members?: number;
  status: 'active' | 'pending' | 'closed' | 'auto_rejected';
  rejection_reason?: string;
}