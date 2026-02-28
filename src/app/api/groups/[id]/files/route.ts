import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupFilePermission, groupMember } from "@/lib/schema";
import { getServerSession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id]/files — get file permission list for a group
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

  const permissions = await db
    .select()
    .from(groupFilePermission)
    .where(eq(groupFilePermission.groupId, groupId));

  return NextResponse.json({ permissions, myRole: membership[0].role });
}

// POST /api/groups/[id]/files — set file permission (admin only)
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

  const { filePath, access } = (await req.json()) as {
    filePath: string;
    access: "visible" | "locked";
  };

  if (!filePath?.trim()) {
    return NextResponse.json({ error: "filePath is required" }, { status: 400 });
  }

  if (!["visible", "locked"].includes(access)) {
    return NextResponse.json({ error: "access must be 'visible' or 'locked'" }, { status: 400 });
  }

  // Upsert: check if existing entry for this file
  const existing = await db
    .select()
    .from(groupFilePermission)
    .where(
      and(
        eq(groupFilePermission.groupId, groupId),
        eq(groupFilePermission.filePath, filePath.trim())
      )
    );

  const now = new Date();

  if (existing.length > 0) {
    await db
      .update(groupFilePermission)
      .set({ access, updatedAt: now })
      .where(eq(groupFilePermission.id, existing[0].id));
  } else {
    await db.insert(groupFilePermission).values({
      id: uuid(),
      groupId,
      filePath: filePath.trim(),
      access,
      updatedAt: now,
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/groups/[id]/files — remove a file permission entry (admin only)
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

  const { filePath } = (await req.json()) as { filePath: string };

  await db
    .delete(groupFilePermission)
    .where(
      and(
        eq(groupFilePermission.groupId, groupId),
        eq(groupFilePermission.filePath, filePath.trim())
      )
    );

  return NextResponse.json({ success: true });
}
