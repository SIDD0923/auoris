import {
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Better Auth tables ──────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Group / Collaboration tables ────────────────────────────────────────────

/** A collaboration group created by an admin user */
export const group = pgTable("group", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Members of a group.
 * role: "admin" | "editor" | "commenter" | "viewer"
 */
export const groupMember = pgTable("group_member", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"), // admin | editor | commenter | viewer
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

/** Chat messages within a group */
export const groupMessage = pgTable("group_message", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * File-level permissions set by the group admin.
 * access: "visible" | "locked"
 *   - visible → members can see & interact based on their role
 *   - locked  → file is hidden / read-only for non-admins
 */
export const groupFilePermission = pgTable("group_file_permission", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  access: text("access").notNull().default("visible"), // visible | locked
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Lightweight "who is typing" status — entries expire after a few seconds */
export const typingStatus = pgTable("typing_status", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => group.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
