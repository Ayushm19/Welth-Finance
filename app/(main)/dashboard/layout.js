import { BarLoader } from "react-spinners";
import { Suspense } from "react";
import { getTeamSidebarData } from "@/actions/team";
import { TeamSidebar } from "@/components/team/team-sidebar";

export default async function Layout({ children }) {
  const teamData = await getTeamSidebarData();

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Dashboard
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <TeamSidebar data={teamData} />
        <div className="flex-1 w-full min-w-0">
          <Suspense
            fallback={
              <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
