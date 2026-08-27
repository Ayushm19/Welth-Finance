"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongoose";
import { checkUser } from "@/lib/checkUser";
import {
  Account,
  Team,
  TeamMember,
  Transaction,
  User,
} from "@/models/allModels";

function serializeMember(member, extra = {}) {
  return {
    _id: member._id,
    teamId: member.teamId,
    userId: member.userId,
    email: member.email,
    role: member.role,
    status: member.status,
    accountAccess: member.accountAccess || [],
    monthlySpendLimit: member.monthlySpendLimit,
    joinedAt: member.joinedAt,
    createdAt: member.createdAt,
    ...extra,
  };
}

function startOfCurrentMonth() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Count member expenses on shared accounts by when they were added (createdAt). */
async function getMemberSpentThisMonth(member) {
  if (!member?.userId) return 0;

  const accountIds = (member.accountAccess || []).map(String);
  if (accountIds.length === 0) return 0;

  const start = startOfCurrentMonth();

  const agg = await Transaction.aggregate([
    {
      $match: {
        userId: String(member.userId),
        type: "EXPENSE",
        accountId: { $in: accountIds },
        createdAt: { $gte: start },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return agg[0] ? parseFloat(agg[0].total.toString()) : 0;
}

export async function ensureAdminTeam(user) {
  let team = await Team.findOne({ adminId: user._id });
  if (!team) {
    team = await Team.create({
      name: `${user.name || "My"} Team`,
      adminId: user._id,
    });

    await TeamMember.create({
      teamId: team._id,
      userId: user._id,
      email: user.email.toLowerCase(),
      role: "ADMIN",
      status: "ACTIVE",
      accountAccess: [],
      monthlySpendLimit: null,
      invitedBy: user._id,
      joinedAt: new Date(),
    });
  }
  return team;
}

export async function createTeam({ name } = {}) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const existing = await Team.findOne({ adminId: user._id });
  if (existing) {
    throw new Error("You already have a team. Open Team to manage it.");
  }

  const accountCount = await Account.countDocuments({ userId: user._id });
  if (accountCount === 0) {
    throw new Error("Create an account first for your team");
  }

  const teamName =
    String(name || "").trim() || `${user.name || "My"} Team`;

  const team = await Team.create({
    name: teamName,
    adminId: user._id,
  });

  await TeamMember.create({
    teamId: team._id,
    userId: user._id,
    email: user.email.toLowerCase(),
    role: "ADMIN",
    status: "ACTIVE",
    accountAccess: [],
    monthlySpendLimit: null,
    invitedBy: user._id,
    joinedAt: new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/team");
  return {
    success: true,
    data: { _id: team._id, name: team.name },
  };
}

export async function renameTeam({ name }) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const team = await Team.findOne({ adminId: user._id });
  if (!team) throw new Error("You don't have a team yet");

  const teamName = String(name || "").trim();
  if (!teamName) throw new Error("Team name is required");

  team.name = teamName;
  await team.save();

  revalidatePath("/dashboard");
  revalidatePath("/team");
  return { success: true, data: { _id: team._id, name: team.name } };
}

async function buildTeamPayload(team, user) {
  const members = await TeamMember.find({
    teamId: team._id,
    status: { $in: ["PENDING", "ACTIVE"] },
  })
    .sort({ role: 1, createdAt: 1 })
    .lean();

  const userIds = members.map((m) => m.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = Object.fromEntries(users.map((u) => [u._id, u]));

  const accounts = await Account.find({ userId: team.adminId })
    .select("_id name balance type")
    .lean();

  const accountsList = accounts.map((a) => ({
    _id: a._id,
    name: a.name,
    type: a.type,
    balance: parseFloat(a.balance?.toString?.() || a.balance || 0),
  }));

  const membersWithMeta = await Promise.all(
    members.map(async (member) => {
      const profile = member.userId ? userMap[member.userId] : null;
      const spentThisMonth =
        member.userId && member.role === "MEMBER" && member.status === "ACTIVE"
          ? await getMemberSpentThisMonth(member)
          : 0;

      return serializeMember(member, {
        name: profile?.name || member.email,
        imageUrl: profile?.imageUrl || null,
        spentThisMonth,
        accountNames: (member.accountAccess || [])
          .map(
            (id) =>
              accountsList.find((a) => String(a._id) === String(id))?.name
          )
          .filter(Boolean),
      });
    })
  );

  const admin = await User.findById(team.adminId).lean();

  return {
    team: {
      _id: team._id,
      name: team.name,
      adminId: team.adminId,
      adminName: admin?.name || "Admin",
      adminImageUrl: admin?.imageUrl || null,
    },
    role: team.adminId === user._id ? "ADMIN" : "MEMBER",
    members: membersWithMeta,
    accounts: accountsList,
  };
}

export async function getTeamSidebarData() {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const pendingInviteDocs = await TeamMember.find({
    email: user.email.toLowerCase(),
    role: "MEMBER",
    status: "PENDING",
  }).lean();

  const pendingInvites = await Promise.all(
    pendingInviteDocs.map(async (invite) => {
      const teamDoc = await Team.findById(invite.teamId).lean();
      const admin = teamDoc
        ? await User.findById(teamDoc.adminId).lean()
        : null;
      const sharedAccounts = await Account.find({
        _id: { $in: invite.accountAccess || [] },
      })
        .select("_id name type")
        .lean();

      return {
        _id: invite._id,
        inviteToken: invite.inviteToken,
        teamId: invite.teamId,
        teamName: teamDoc?.name || "Team",
        monthlySpendLimit: invite.monthlySpendLimit,
        accountAccess: invite.accountAccess || [],
        accounts: sharedAccounts.map((a) => ({
          _id: a._id,
          name: a.name,
          type: a.type,
        })),
        admin: {
          name: admin?.name || "Admin",
          email: admin?.email || "",
          imageUrl: admin?.imageUrl || null,
        },
      };
    })
  );

  const adminTeam = await Team.findOne({ adminId: user._id }).lean();

  const personalAccounts = await Account.find({ userId: user._id })
    .select("_id name balance type")
    .lean();
  const personalAccountsList = personalAccounts.map((a) => ({
    _id: a._id,
    name: a.name,
    type: a.type,
    balance: parseFloat(a.balance?.toString?.() || a.balance || 0),
  }));

  const joinedMemberships = await TeamMember.find({
    userId: user._id,
    status: "ACTIVE",
    role: "MEMBER",
  }).lean();

  const joinedTeams = await Promise.all(
    joinedMemberships.map(async (m) => {
      const teamDoc = await Team.findById(m.teamId).lean();
      const admin = teamDoc
        ? await User.findById(teamDoc.adminId).lean()
        : null;
      const sharedAccounts = await Account.find({
        _id: { $in: m.accountAccess || [] },
      })
        .select("_id name")
        .lean();

      return {
        membershipId: m._id,
        teamId: m.teamId,
        teamName: teamDoc?.name || "Team",
        monthlySpendLimit: m.monthlySpendLimit,
        accountAccess: m.accountAccess || [],
        accountNames: sharedAccounts.map((a) => a.name),
        spentThisMonth: await getMemberSpentThisMonth(m),
        admin: {
          name: admin?.name || "Admin",
          email: admin?.email || "",
          imageUrl: admin?.imageUrl || null,
        },
      };
    })
  );

  let team = adminTeam;
  let role = adminTeam ? "ADMIN" : null;

  if (!team) {
    const activeMembership = joinedMemberships[0];
    if (activeMembership) {
      team = await Team.findById(activeMembership.teamId).lean();
      role = "MEMBER";
    }
  }

  if (!team) {
    return {
      team: null,
      role: null,
      members: [],
      pendingInvites,
      joinedTeams,
      accounts: personalAccountsList,
      canCreateTeam: true,
      hasOwnedTeam: false,
      hasPersonalAccount: personalAccountsList.length > 0,
    };
  }

  const payload = await buildTeamPayload(team, user);

  return {
    ...payload,
    pendingInvites: payload.role === "ADMIN" ? [] : pendingInvites,
    joinedTeams,
    accounts:
      payload.role === "ADMIN" ? personalAccountsList : payload.accounts,
    canCreateTeam: !adminTeam,
    hasOwnedTeam: Boolean(adminTeam),
    hasPersonalAccount: personalAccountsList.length > 0,
  };
}

export async function getOwnedTeamPageData() {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const pendingInviteDocs = await TeamMember.find({
    email: user.email.toLowerCase(),
    role: "MEMBER",
    status: "PENDING",
  }).lean();

  const pendingInvites = await Promise.all(
    pendingInviteDocs.map(async (invite) => {
      const teamDoc = await Team.findById(invite.teamId).lean();
      const admin = teamDoc
        ? await User.findById(teamDoc.adminId).lean()
        : null;
      return {
        _id: invite._id,
        teamName: teamDoc?.name || "Team",
        monthlySpendLimit: invite.monthlySpendLimit,
        accountAccess: invite.accountAccess || [],
        admin: {
          name: admin?.name || "Admin",
          email: admin?.email || "",
          imageUrl: admin?.imageUrl || null,
        },
      };
    })
  );

  const joined = await TeamMember.find({
    userId: user._id,
    status: "ACTIVE",
    role: "MEMBER",
  }).lean();

  const joinedTeams = await Promise.all(
    joined.map(async (m) => {
      const teamDoc = await Team.findById(m.teamId).lean();
      const admin = teamDoc
        ? await User.findById(teamDoc.adminId).lean()
        : null;
      return {
        membershipId: m._id,
        teamId: m.teamId,
        teamName: teamDoc?.name || "Team",
        monthlySpendLimit: m.monthlySpendLimit,
        accountAccess: m.accountAccess || [],
        spentThisMonth: await getMemberSpentThisMonth(m),
        admin: {
          name: admin?.name || "Admin",
          imageUrl: admin?.imageUrl || null,
        },
      };
    })
  );

  const owned = await Team.findOne({ adminId: user._id }).lean();
  const personalAccounts = await Account.find({ userId: user._id })
    .select("_id name balance type")
    .lean();
  const personalAccountsList = personalAccounts.map((a) => ({
    _id: a._id,
    name: a.name,
    type: a.type,
    balance: parseFloat(a.balance?.toString?.() || a.balance || 0),
  }));

  if (!owned) {
    return {
      ownedTeam: null,
      canCreateTeam: true,
      hasPersonalAccount: personalAccountsList.length > 0,
      pendingInvites,
      joinedTeams,
      accounts: personalAccountsList,
      members: [],
    };
  }

  const payload = await buildTeamPayload(owned, user);
  return {
    ownedTeam: payload.team,
    canCreateTeam: false,
    hasPersonalAccount: personalAccountsList.length > 0,
    pendingInvites,
    joinedTeams,
    accounts: payload.accounts,
    members: payload.members,
    role: "ADMIN",
  };
}

export async function inviteTeammate({
  email,
  accountIds = [],
  monthlySpendLimit = null,
}) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address");
  }

  if (normalizedEmail === user.email.toLowerCase()) {
    throw new Error("You cannot invite yourself");
  }

  const team = await ensureAdminTeam(user);

  const validAccounts = await Account.find({
    _id: { $in: accountIds },
    userId: user._id,
  }).select("_id");

  const accessIds = validAccounts.map((a) => a._id);

  await Account.updateMany(
    { _id: { $in: accessIds } },
    { $set: { teamId: team._id } }
  );

  const limit =
    monthlySpendLimit === "" || monthlySpendLimit == null
      ? null
      : Number(monthlySpendLimit);

  if (limit != null && (Number.isNaN(limit) || limit < 0)) {
    throw new Error("Monthly spend limit must be a positive number");
  }

  const existing = await TeamMember.findOne({
    teamId: team._id,
    email: normalizedEmail,
  });

  const inviteToken = crypto.randomBytes(24).toString("hex");

  let member;
  if (existing) {
    if (existing.status === "ACTIVE") {
      throw new Error("This person is already on your team");
    }
    existing.status = "PENDING";
    existing.userId = null;
    existing.joinedAt = undefined;
    existing.accountAccess = accessIds;
    existing.monthlySpendLimit = limit;
    existing.inviteToken = inviteToken;
    existing.invitedBy = user._id;
    existing.role = "MEMBER";
    member = await existing.save();
  } else {
    member = await TeamMember.create({
      teamId: team._id,
      email: normalizedEmail,
      role: "MEMBER",
      status: "PENDING",
      accountAccess: accessIds,
      monthlySpendLimit: limit,
      inviteToken,
      invitedBy: user._id,
    });
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    data: serializeMember(member),
  };
}

export async function acceptInviteByToken(token) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("Sign in to accept this invite");

  const member = await TeamMember.findOne({
    inviteToken: token,
    status: "PENDING",
  });

  if (!member) {
    throw new Error("Invite is invalid, declined, or already used");
  }

  if (member.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error(
      `This invite was sent to ${member.email}. Sign in with that Google account.`
    );
  }

  member.userId = user._id;
  member.status = "ACTIVE";
  member.joinedAt = new Date();
  member.inviteToken = undefined;
  await member.save();

  revalidatePath("/dashboard");
  return { success: true, teamId: member.teamId };
}

export async function acceptInviteById(memberId) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("Sign in to accept this invite");

  const member = await TeamMember.findOne({
    _id: memberId,
    email: user.email.toLowerCase(),
    status: "PENDING",
    role: "MEMBER",
  });

  if (!member) throw new Error("Invite not found");

  member.userId = user._id;
  member.status = "ACTIVE";
  member.joinedAt = new Date();
  member.inviteToken = undefined;
  await member.save();

  revalidatePath("/dashboard");
  return { success: true, teamId: member.teamId };
}

export async function declineInvite(memberId) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const member = await TeamMember.findOne({
    _id: memberId,
    email: user.email.toLowerCase(),
    status: "PENDING",
    role: "MEMBER",
  });

  if (!member) throw new Error("Invite not found");

  member.status = "REVOKED";
  member.userId = null;
  member.inviteToken = undefined;
  await member.save();

  revalidatePath("/dashboard");
  return { success: true };
}

export async function leaveTeam(membershipIdOrTeamId) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const query = {
    userId: user._id,
    status: "ACTIVE",
    role: "MEMBER",
  };

  if (membershipIdOrTeamId) {
    query.$or = [
      { _id: membershipIdOrTeamId },
      { teamId: membershipIdOrTeamId },
    ];
  }

  const membership = await TeamMember.findOne(query);

  if (!membership) throw new Error("You are not on that team");

  membership.status = "REVOKED";
  membership.userId = null;
  membership.inviteToken = undefined;
  membership.joinedAt = undefined;
  await membership.save();

  revalidatePath("/dashboard");
  revalidatePath("/team");
  return { success: true };
}

export async function getInviteDetails(token) {
  await connectToDatabase();

  const member = await TeamMember.findOne({
    inviteToken: token,
    status: "PENDING",
  }).lean();

  if (!member) return null;

  const teamDoc = await Team.findById(member.teamId).lean();
  const admin = teamDoc ? await User.findById(teamDoc.adminId).lean() : null;
  const sharedAccounts = await Account.find({
    _id: { $in: member.accountAccess || [] },
  })
    .select("_id name type")
    .lean();

  return {
    _id: member._id,
    email: member.email,
    teamName: teamDoc?.name || "Team",
    monthlySpendLimit: member.monthlySpendLimit,
    accounts: sharedAccounts.map((a) => ({
      _id: a._id,
      name: a.name,
      type: a.type,
    })),
    admin: {
      name: admin?.name || "Admin",
      email: admin?.email || "",
      imageUrl: admin?.imageUrl || null,
    },
  };
}

export async function updateMemberAccess({
  memberId,
  accountIds = [],
  monthlySpendLimit = null,
}) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const team = await Team.findOne({ adminId: user._id });
  if (!team) throw new Error("Only the team admin can update access");

  const member = await TeamMember.findOne({
    _id: memberId,
    teamId: team._id,
    role: "MEMBER",
  });
  if (!member) throw new Error("Teammate not found");

  const validAccounts = await Account.find({
    _id: { $in: accountIds },
    userId: user._id,
  }).select("_id");

  const accessIds = validAccounts.map((a) => a._id);
  await Account.updateMany(
    { _id: { $in: accessIds } },
    { $set: { teamId: team._id } }
  );

  const limit =
    monthlySpendLimit === "" || monthlySpendLimit == null
      ? null
      : Number(monthlySpendLimit);

  member.accountAccess = accessIds;
  member.monthlySpendLimit = limit;
  await member.save();

  revalidatePath("/dashboard");
  return { success: true };
}

export async function revokeTeammate(memberId) {
  await connectToDatabase();
  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const team = await Team.findOne({ adminId: user._id });
  if (!team) throw new Error("Only the team admin can remove teammates");

  const member = await TeamMember.findOne({
    _id: memberId,
    teamId: team._id,
    role: "MEMBER",
  });
  if (!member) throw new Error("Teammate not found");

  member.status = "REVOKED";
  member.userId = null;
  member.inviteToken = undefined;
  member.joinedAt = undefined;
  await member.save();

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getAccessibleAccountIds(user) {
  const personal = await Account.find({ userId: user._id }).select("_id");
  const personalIds = personal.map((a) => a._id);

  const memberships = await TeamMember.find({
    userId: user._id,
    status: "ACTIVE",
    role: "MEMBER",
  }).lean();

  const sharedIds = memberships.flatMap((m) => m.accountAccess || []);
  return { personalIds, sharedIds, memberships };
}

export async function assertAccountAccess(user, accountId, { forExpense = false } = {}) {
  const account = await Account.findById(accountId);
  if (!account) throw new Error("Account not found");

  if (account.userId === user._id) {
    return { account, access: "OWNER", membership: null };
  }

  const membership = await TeamMember.findOne({
    userId: user._id,
    status: "ACTIVE",
    role: "MEMBER",
    accountAccess: accountId,
  });

  if (!membership) {
    throw new Error("You do not have access to this account");
  }

  if (forExpense && membership.monthlySpendLimit != null) {
    const spent = await getMemberSpentThisMonth(membership);
    return {
      account,
      access: "SHARED",
      membership,
      spentThisMonth: spent,
      monthlySpendLimit: membership.monthlySpendLimit,
    };
  }

  return { account, access: "SHARED", membership };
}
