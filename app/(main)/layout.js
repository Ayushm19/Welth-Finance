import React from "react";
import { auth } from "@clerk/nextjs/server";

const MainLayout = async ({ children }) => {
  await auth.protect();

  return <div className="container mx-auto my-32">{children}</div>;
};

export default MainLayout;
