import type { Metadata } from "next";
import { NotificationProvider } from "../state/NotificationContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Affordmed Notifications",
  description: "Real-time notification system using WebSockets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
