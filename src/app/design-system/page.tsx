import type { Metadata } from "next";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "ZEDU design system",
  description: "Live reference for the ZEDU v2 components and tokens.",
};

export default function DesignSystemPage() {
  return <Showcase />;
}
