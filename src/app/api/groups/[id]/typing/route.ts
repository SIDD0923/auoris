import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { typingStatus, groupMember, user } from "@/lib/schema";
import { getServerSession } from "@/lib/session";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuid } from "uuid";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id]/typing — who is currently typing
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  // Only show typing statuses from the last 4 seconds
  const cutoff = new Date(Date.now() - 4000);

  const typing = await db
    .select({
      userId: typingStatus.userId,
      userName: user.name,
    })
    .from(typingStatus)
    .innerJoin(user, eq(typingStatus.userId, user.id))
    .where(
      and(
        eq(typingStatus.groupId, groupId),
        gt(typingStatus.updatedAt, cutoff)
      )
    );

  // Exclude current user from the typing list
  const others = typing.filter((t) => t.userId !== session.user.id);

  return NextResponse.json(others);
}

// POST /api/groups/[id]/typing — signal that I'm typing
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  // Upsert typing status
  const existing = await db
    .select()
    .from(typingStatus)
    .where(
      and(
        eq(typingStatus.groupId, groupId),
        eq(typingStatus.userId, session.user.id)
      )
    );

  const now = new Date();

  if (existing.length > 0) {
    await db
      .update(typingStatus)
      .set({ updatedAt: now })
      .where(eq(typingStatus.id, existing[0].id));
  } else {
    await db.insert(typingStatus).values({
      id: uuid(),
      groupId,
      userId: session.user.id,
      updatedAt: now,
    });
  }

  return NextResponse.json({ success: true });
}
