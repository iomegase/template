"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { publicHomeRoute } from "@/features/auth/routes";

export async function authenticate(
  _: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "Unable to sign in right now.";
      }
    }

    throw error;
  }
}

export async function logout() {
  await signOut({
    redirectTo: publicHomeRoute,
  });
}
