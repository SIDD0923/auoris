import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { group, groupMember, user } from "@/lib/schema";
import { getServerSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

// GET /api/groups — list groups the current user belongs to
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await db
    .select({
      groupId: groupMember.groupId,
      role: groupMember.role,
      groupName: group.name,
      groupDescription: group.description,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
    })
    .from(groupMember)
    .innerJoin(group, eq(groupMember.groupId, group.id))
    .where(eq(groupMember.userId, session.user.id));

  return NextResponse.json(memberships);
}

// POST /api/groups — create a new group
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, members } = body as {
    name: string;
    description?: string;
    members?: { email: string; role: string }[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  const groupId = uuid();
  const now = new Date();

  // Create the group
  await db.insert(group).values({
    id: groupId,
    name: name.trim(),
    description: description?.trim() ?? null,
    createdBy: session.user.id,
    createdAt: now,
    updatedAt: now,
  });

  // Add creator as admin
  await db.insert(groupMember).values({
    id: uuid(),
    groupId,
    userId: session.user.id,
    role: "admin",
    joinedAt: now,
  });

  // Add invited members
  if (members && members.length > 0) {
    for (const m of members) {
      const found = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, m.email.trim().toLowerCase()));

      if (found.length > 0) {
        await db.insert(groupMember).values({
          id: uuid(),
          groupId,
          userId: found[0].id,
          role: m.role || "viewer",
          joinedAt: now,
        });
      }
      // If user not found, skip silently (they haven't signed up yet)
    }
  }

  return NextResponse.json({ id: groupId, name, description }, { status: 201 });
}
