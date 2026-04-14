export type CustomerListItem = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerFormValues = {
  name: string;
  email: string;
  password: string;
};

export type CustomerCreateInput = {
  name: string;
  email: string;
  password: string;
};

export type CustomerUpdateInput = {
  name: string;
  email: string;
  password?: string;
};
