import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, InsertStudent, guardians, InsertGuardian, attendance, InsertAttendance } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Management ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = nanoid();

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    loginMethod: 'local',
    role: 'admin',
  });

  return userId;
}

export async function verifyPassword(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

export async function updatePassword(userId: string, newPassword: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
}

// ==================== Student Management ====================

export async function createStudent(student: Omit<InsertStudent, 'id'>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const studentId = nanoid();
  await db.insert(students).values({
    ...student,
    id: studentId,
  });

  return studentId;
}

export async function getStudent(id: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllStudents() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(students).orderBy(students.name);
}

export async function getActiveStudents() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(students).where(eq(students.isActive, true)).orderBy(students.name);
}

export async function updateStudent(id: string, data: Partial<InsertStudent>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(students)
    .set(data)
    .where(eq(students.id, id));
}

export async function deleteStudent(id: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Delete related guardians and attendance records
  await db.delete(guardians).where(eq(guardians.studentId, id));
  await db.delete(attendance).where(eq(attendance.studentId, id));
  await db.delete(students).where(eq(students.id, id));
}

// ==================== Guardian Management ====================

export async function createGuardian(guardian: Omit<InsertGuardian, 'id'>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const guardianId = nanoid();
  await db.insert(guardians).values({
    ...guardian,
    id: guardianId,
  });

  return guardianId;
}

export async function getGuardiansByStudent(studentId: string) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(guardians).where(eq(guardians.studentId, studentId));
}

export async function updateGuardian(id: string, data: Partial<InsertGuardian>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(guardians)
    .set(data)
    .where(eq(guardians.id, id));
}

export async function deleteGuardian(id: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(guardians).where(eq(guardians.id, id));
}

// ==================== Attendance Management ====================

export async function recordAttendance(record: Omit<InsertAttendance, 'id'>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const attendanceId = nanoid();
  
  // Check if attendance already exists for this student and date
  const existing = await db.select()
    .from(attendance)
    .where(and(
      eq(attendance.studentId, record.studentId),
      sql`${attendance.classDate} = ${record.classDate}`
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    await db.update(attendance)
      .set({ present: record.present, notes: record.notes })
      .where(eq(attendance.id, existing[0].id));
    return existing[0].id;
  } else {
    // Create new record
    await db.insert(attendance).values({
      ...record,
      id: attendanceId,
    });
    return attendanceId;
  }
}

export async function getAttendanceByDate(classDate: string) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select({
    id: attendance.id,
    studentId: attendance.studentId,
    studentName: students.name,
    classDate: attendance.classDate,
    present: attendance.present,
    notes: attendance.notes,
  })
  .from(attendance)
  .leftJoin(students, eq(attendance.studentId, students.id))
  .where(sql`${attendance.classDate} = ${classDate}`)
  .orderBy(students.name);
}

export async function getAttendanceByStudent(studentId: string, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  let query = db.select()
    .from(attendance)
    .where(eq(attendance.studentId, studentId))
    .orderBy(desc(attendance.classDate));

  if (startDate && endDate) {
    query = db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.classDate} >= ${startDate}`,
        sql`${attendance.classDate} <= ${endDate}`
      ))
      .orderBy(desc(attendance.classDate));
  } else if (startDate) {
    query = db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.classDate} >= ${startDate}`
      ))
      .orderBy(desc(attendance.classDate));
  } else if (endDate) {
    query = db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.classDate} <= ${endDate}`
      ))
      .orderBy(desc(attendance.classDate));
  }

  return await query;
}

export async function getAttendanceStats(studentId: string, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) {
    return { total: 0, present: 0, absent: 0, rate: 0 };
  }

  let query = db.select()
    .from(attendance)
    .where(eq(attendance.studentId, studentId));

  if (startDate && endDate) {
    query = db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.classDate} >= ${startDate}`,
        sql`${attendance.classDate} <= ${endDate}`
      ));
  } else if (startDate) {
    query = db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.classDate} >= ${startDate}`
      ));
  } else if (endDate) {
    query = db.select()
      .from(attendance)
      .where(and(
        eq(attendance.studentId, studentId),
        sql`${attendance.classDate} <= ${endDate}`
      ));
  }

  const records = await query;

  const total = records.length;
  const present = records.filter(r => r.present).length;
  const absent = total - present;
  const rate = total > 0 ? (present / total) * 100 : 0;

  return { total, present, absent, rate };
}

export async function deleteAttendance(id: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(attendance).where(eq(attendance.id, id));
}

