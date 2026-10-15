"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/zedu";

export function SignInButton() {
  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
}
