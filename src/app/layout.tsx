import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { RoleProvider } from "@/contexts/RoleContext";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LINURI",
  description:
    "Literacy and Numeracy Readiness Indicator — Adaptive Learning System for Grade 6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <FeatureFlagProvider>
          <RoleProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </RoleProvider>
        </FeatureFlagProvider>
      </body>
    </html>
  );
}
