export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  orgUnit: string;
  title: string;
  department: string;
}

export interface HistoryBatch {
  id: string;
  createdAt: string;
  name: string;
  usersCount: number;
  password: string;
  requirePasswordChange: boolean;
  users: UserRecord[];
}
