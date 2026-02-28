import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { group, groupMember, user } from "@/lib/schema";
import { getServerSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id] — get group details + members
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  // Check membership
  const membership = await db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, session.user.id)));

  if (membership.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Get group info
  const groupInfo = await db.select().from(group).where(eq(group.id, groupId));
  if (groupInfo.length === 0) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Get all members with user info
  const members = await db
    .select({
      memberId: groupMember.id,
      userId: groupMember.userId,
      role: groupMember.role,
      joinedAt: groupMember.joinedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(groupMember)
    .innerJoin(user, eq(groupMember.userId, user.id))
    .where(eq(groupMember.groupId, groupId));

  return NextResponse.json({
    ...groupInfo[0],
    members,
    myRole: membership[0].role,
  });
}

// PATCH /api/groups/[id] — update group (admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  // Check admin role
  const membership = await db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, session.user.id)));

  if (membership.length === 0 || membership[0].role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description } = body;

  await db
    .update(group)
    .set({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      updatedAt: new Date(),
    })
    .where(eq(group.id, groupId));

  return NextResponse.json({ success: true });
}

// DELETE /api/groups/[id] — delete group (admin only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  const membership = await db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, session.user.id)));

  if (membership.length === 0 || membership[0].role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  await db.delete(group).where(eq(group.id, groupId));
  return NextResponse.json({ success: true });
}
