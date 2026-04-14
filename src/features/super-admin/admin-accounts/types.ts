export type ManagedAdminAccountListItem = {
  id: string;
  name: string | null;
  email: string;
  projectId: string | null;
  projectName: string | null;
  projectSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ManagedAdminAccountFormValues = {
  name: string;
  email: string;
  password: string;
  projectId: string;
};

export type ManagedAdminAccountCreateInput = {
  name: string;
  email: string;
  password: string;
  projectId: string;
};

export type ManagedAdminAccountUpdateInput = {
  name: string;
  email: string;
  password?: string;
  projectId: string;
};

export type ProjectOption = {
  id: string;
  name: string;
  slug: string;
};
