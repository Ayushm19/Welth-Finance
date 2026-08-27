import { getOwnedTeamPageData } from "@/actions/team";
import { TeamWorkspace } from "@/components/team/team-workspace";

export default async function TeamPage() {
  const data = await getOwnedTeamPageData();
  return <TeamWorkspace data={data} />;
}
