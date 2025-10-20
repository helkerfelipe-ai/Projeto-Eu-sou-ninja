import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.verifyPassword(input.email, input.password);
        
        if (!user) {
          throw new Error("Invalid credentials");
        }

        // Create JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET || ENV.cookieSecret,
          { expiresIn: '7d' }
        );

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { success: true, user };
      }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }))
      .mutation(async ({ input }) => {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("User already exists");
        }

        const userId = await db.createLocalUser(input.email, input.password, input.name);
        return { success: true, userId };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.email) {
          throw new Error("User email not found");
        }

        // Verify current password
        const user = await db.verifyPassword(ctx.user.email, input.currentPassword);
        if (!user) {
          throw new Error("Current password is incorrect");
        }

        // Update password
        await db.updatePassword(ctx.user.id, input.newPassword);
        return { success: true };
      }),
  }),

  students: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllStudents();
    }),

    listActive: protectedProcedure.query(async () => {
      return await db.getActiveStudents();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const student = await db.getStudent(input.id);
        if (!student) {
          throw new Error("Student not found");
        }
        return student;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        birthDate: z.string(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        isMinor: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const studentId = await db.createStudent({
          ...input,
          birthDate: new Date(input.birthDate),
        });
        return { success: true, studentId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        birthDate: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        isActive: z.boolean().optional(),
        isMinor: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, birthDate, ...data } = input;
        await db.updateStudent(id, {
          ...data,
          ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteStudent(input.id);
        return { success: true };
      }),
  }),

  guardians: router({
    listByStudent: protectedProcedure
      .input(z.object({ studentId: z.string() }))
      .query(async ({ input }) => {
        return await db.getGuardiansByStudent(input.studentId);
      }),

    create: protectedProcedure
      .input(z.object({
        studentId: z.string(),
        name: z.string().min(2),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const guardianId = await db.createGuardian(input);
        return { success: true, guardianId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateGuardian(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteGuardian(input.id);
        return { success: true };
      }),
  }),

  attendance: router({
    record: protectedProcedure
      .input(z.object({
        studentId: z.string(),
        classDate: z.string(),
        present: z.boolean(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const attendanceId = await db.recordAttendance({
          ...input,
          classDate: new Date(input.classDate),
        });
        return { success: true, attendanceId };
      }),

    getByDate: protectedProcedure
      .input(z.object({ classDate: z.string() }))
      .query(async ({ input }) => {
        return await db.getAttendanceByDate(input.classDate);
      }),

    getByStudent: protectedProcedure
      .input(z.object({
        studentId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAttendanceByStudent(
          input.studentId,
          input.startDate,
          input.endDate
        );
      }),

    getStats: protectedProcedure
      .input(z.object({
        studentId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAttendanceStats(
          input.studentId,
          input.startDate,
          input.endDate
        );
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteAttendance(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

