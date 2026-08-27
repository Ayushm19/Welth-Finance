import { getInviteDetails } from "@/actions/team";
import InviteAcceptClient from "./invite-accept-client";

export default async function InvitePage({ params }) {
  const { token } = await params;
  const invite = await getInviteDetails(token);

  return <InviteAcceptClient token={token} invite={invite} />;
}
