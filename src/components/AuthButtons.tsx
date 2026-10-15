"use client";

import { signIn } from "next-auth/react";
import { button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <button className={button({ size: "lg" })} onClick={() => signIn("google")}>
      Sign in with Google
    </button>
  );
}
