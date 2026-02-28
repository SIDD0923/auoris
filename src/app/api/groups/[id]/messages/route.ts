import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { groupMessage, groupMember, user } from "@/lib/schema";
import { getServerSession } from "@/lib/session";
import { eq, and, desc, gt } from "drizzle-orm";
import { v4 as uuid } from "uuid";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/groups/[id]/messages?after=<timestamp> — fetch messages (with optional cursor)
export async function GET(req: NextRequest, { params }: Params) {
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

  const afterParam = req.nextUrl.searchParams.get("after");

  let messages;
  if (afterParam) {
    const afterDate = new Date(afterParam);
    messages = await db
      .select({
        id: groupMessage.id,
        content: groupMessage.content,
        createdAt: groupMessage.createdAt,
        userId: groupMessage.userId,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(groupMessage)
      .innerJoin(user, eq(groupMessage.userId, user.id))
      .where(
        and(
          eq(groupMessage.groupId, groupId),
          gt(groupMessage.createdAt, afterDate)
        )
      )
      .orderBy(groupMessage.createdAt)
      .limit(100);
  } else {
    // Return last 50 messages
    messages = await db
      .select({
        id: groupMessage.id,
        content: groupMessage.content,
        createdAt: groupMessage.createdAt,
        userId: groupMessage.userId,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(groupMessage)
      .innerJoin(user, eq(groupMessage.userId, user.id))
      .where(eq(groupMessage.groupId, groupId))
      .orderBy(desc(groupMessage.createdAt))
      .limit(50);

    messages.reverse(); // chronological order
  }

  return NextResponse.json(messages);
}

// POST /api/groups/[id]/messages — send a message
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await params;

  // Check membership (viewer can still chat)
  const membership = await db
    .select()
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, session.user.id)));

  if (membership.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { content } = (await req.json()) as { content: string };
  if (!content?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const msgId = uuid();
  const now = new Date();

  await db.insert(groupMessage).values({
    id: msgId,
    groupId,
    userId: session.user.id,
    content: content.trim(),
    createdAt: now,
  });

  return NextResponse.json({
    id: msgId,
    content: content.trim(),
    createdAt: now,
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    userImage: session.user.image,
  }, { status: 201 });
}
