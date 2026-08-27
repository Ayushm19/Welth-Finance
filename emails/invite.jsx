import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export default function InviteEmail({
  inviterName = "A teammate",
  teamName = "Welth Team",
  inviteUrl = "#",
  monthlySpendLimit = null,
}) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {teamName} on Welth
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re invited to Welth</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> invited you to join{" "}
            <strong>{teamName}</strong> as a teammate.
          </Text>
          {monthlySpendLimit != null && (
            <Text style={text}>
              Your monthly spend limit on shared accounts:{" "}
              <strong>${Number(monthlySpendLimit).toFixed(2)}</strong>
            </Text>
          )}
          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Accept invite
            </Button>
          </Section>
          <Text style={muted}>
            Sign in with Google using this email address to join the team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#111827",
};

const text = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
};

const muted = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#6b7280",
};

const buttonContainer = {
  textAlign: "center",
  margin: "28px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 24px",
};
