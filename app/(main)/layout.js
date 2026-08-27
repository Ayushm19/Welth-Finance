import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const MainLayout = async ({ children }) => {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return <div className="container mx-auto my-32">{children}</div>;
};

export default MainLayout;
