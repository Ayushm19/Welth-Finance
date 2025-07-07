import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "sonner";

// 👇 Add this import
import { connectToDatabase } from "@/lib/mongoose";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Welth",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  // 👇 Trigger the MongoDB connection when layout renders on the server
  connectToDatabase();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/logo-sm.png" sizes="any" />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow px-4 sm:px-6 lg:px-8">{children}</main>
        <Toaster richColors />
        <footer className="bg-blue-50 py-12 text-center text-gray-600">
          <p>Made with 💗 by Ayush Mishra</p>
        </footer>
      </body>
    </html>
  );
}
