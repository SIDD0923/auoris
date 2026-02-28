import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupMember, user } from "@/lib/schema";
import { getServerSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/groups/[id]/members — add a member (admin only)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  // Check admin
  const membership = await db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, session.user.id)));

  if (membership.length === 0 || membership[0].role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { email, role } = (await req.json()) as { email: string; role: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const validRoles = ["admin", "editor", "commenter", "viewer"];
  const memberRole = validRoles.includes(role) ? role : "viewer";

  // Find user by email
  const found = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()));

  if (found.length === 0) {
    return NextResponse.json(
      { error: "User not found. They must sign up first." },
      { status: 404 }
    );
  }

  // Check if already a member
  const existing = await db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, found[0].id)));

  if (existing.length > 0) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  await db.insert(groupMember).values({
    id: uuid(),
    groupId,
    userId: found[0].id,
    role: memberRole,
    joinedAt: new Date(),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

// PATCH /api/groups/[id]/members — update member role (admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
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

  const { userId, role } = (await req.json()) as { userId: string; role: string };
  const validRoles = ["admin", "editor", "commenter", "viewer"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await db
    .update(groupMember)
    .set({ role })
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId)));

  return NextResponse.json({ success: true });
}

// DELETE /api/groups/[id]/members — remove a member (admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
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

  const { userId } = (await req.json()) as { userId: string };

  // Can't remove yourself if you're the only admin
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  await db
    .delete(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId)));

  return NextResponse.json({ success: true });
}
