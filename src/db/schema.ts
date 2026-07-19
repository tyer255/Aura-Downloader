import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, boolean, varchar, jsonb, integer, vector } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: varchar('role', { length: 50 }).default('end_user').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 50 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
