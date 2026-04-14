export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUserFormValues = {
  name: string;
  email: string;
  password: string;
};

export type AdminUserCreateInput = {
  name: string;
  email: string;
  password: string;
};

export type AdminUserUpdateInput = {
  name: string;
  email: string;
  password?: string;
};
