import { mysqlEnum, mysqlTable, text, timestamp, varchar, date, boolean, int, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
  passwordHash: text("passwordHash"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Students table - stores student information
 */
export const students = mysqlTable("students", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  birthDate: date("birthDate").notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  isActive: boolean("isActive").default(true).notNull(),
  isMinor: boolean("isMinor").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Guardians table - stores legal guardian information for minor students
 */
export const guardians = mysqlTable("guardians", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentId: varchar("studentId", { length: 64 }).notNull(),
  name: text("name").notNull(),
  relationship: varchar("relationship", { length: 50 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  cpf: varchar("cpf", { length: 14 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  studentIdIdx: index("studentId_idx").on(table.studentId),
}));

export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = typeof guardians.$inferInsert;

/**
 * Attendance table - stores attendance records for each student per class date
 */
export const attendance = mysqlTable("attendance", {
  id: varchar("id", { length: 64 }).primaryKey(),
  studentId: varchar("studentId", { length: 64 }).notNull(),
  classDate: date("classDate").notNull(),
  present: boolean("present").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  studentIdIdx: index("studentId_idx").on(table.studentId),
  classDateIdx: index("classDate_idx").on(table.classDate),
  studentDateIdx: index("student_date_idx").on(table.studentId, table.classDate),
}));

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

