// Service class or helper functions for auth business logic.
// Contains operations for database queries, transformations, and system actions.

import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Registers a new user in the system.
 * Hashes user passwords and maps roles/permissions appropriately.
 *
 * @param {Object} data - Registration attributes.
 * @param {string} data.fullName - User's full name.
 * @param {string} data.email - User's email.
 * @param {string} data.password - Cleartext password.
 * @param {string} [data.role] - User role ("ADMIN", "STAFF", "CLIENT").
 * @param {string} [data.avatar] - URL or path of avatar image.
 * @returns {Promise<import('@prisma/client').User>} Created user instance.
 */
export const registerUser = async (data) => {
  const { fullName, email, password, avatar } = data;
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  if (!password) {
    throw new Error("Password is required for registration");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: data.role || "CLIENT",
      phone: data.phone || null,
      company: data.company || null,
      status: data.status || "Active",
      avatar: avatar || null,
      // Sub-admin specific fields
      adminRole: data.adminRole || null,
      permissions: data.permissions || null,
    },
  });

  return user;
};


/**
 * Authenticates user credentials, checking active/suspension status.
 *
 * @param {Object} data - Authentication credentials.
 * @param {string} data.email - User's email.
 * @param {string} data.password - Cleartext password.
 * @returns {Promise<import('@prisma/client').User>} Verified user instance.
 */
export const loginUser = async (data) => {
  const { email, password } = data;
  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { theme: true },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status === "Suspended") {
    throw new Error("Your account has been suspended. Please contact your administrator.");
  }

  if (!user.isActive || user.status === "Inactive") {
    throw new Error("Account is deactivated. Please contact support.");
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );


  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

/**
 * Updates a user's self profile configuration.
 *
 * @param {number|string} id - Target user ID.
 * @param {Object} data - Profile updates.
 * @param {string} [data.fullName] - Updated name.
 * @param {string} [data.email] - Updated email (checks for conflicts).
 * @param {string} [data.password] - Updated cleartext password.
 * @returns {Promise<import('@prisma/client').User>} Updated user instance.
 */
export const updateProfile = async (id, data) => {
  const { fullName, email, password, twoFactorEnabled, avatar, phone, company } = data;
  const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

  if (normalizedEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser && existingUser.id !== Number(id)) {
      throw new Error("Email is already taken");
    }
  }

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (normalizedEmail) updateData.email = normalizedEmail;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
    updateData.isFirstLogin = false;
  }
  if (twoFactorEnabled !== undefined) {
    updateData.twoFactorEnabled = twoFactorEnabled;
  }
  if (avatar !== undefined) {
    updateData.avatar = avatar;
  }
  if (phone !== undefined) {
    updateData.phone = phone;
  }
  if (company !== undefined) {
    updateData.company = company;
  }

  const updatedUser = await prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
    include: { theme: true },
  });

  return updatedUser;
};

/**
 * Retrieves lists of system users based on role filter and pagination parameters.
 *
 * @param {Object} filters - Search filters.
 * @param {string} [filters.role] - Target role limit.
 * @param {number|string} [filters.skip] - Number of items to skip.
 * @param {number|string} [filters.take] - Limit of items to retrieve.
 * @returns {Promise<import('@prisma/client').User[]>} List of matching users.
 */
export const getAllUsers = async (filters) => {
  const { role, skip, take } = filters;
  const where = {};
  if (role && role !== "all") {
    where.role = role;
  }
  return await prisma.user.findMany({
    where,
    orderBy: { fullName: "asc" },
    skip: skip !== undefined ? parseInt(skip) : undefined,
    take: take !== undefined ? parseInt(take) : undefined,
  });
};

/**
 * Updates a user profile dynamically by ID (Admin control).
 * Manages transition to/from "Suspended" status with timestamps and reason strings.
 *
 * @param {number|string} id - Target user ID.
 * @param {Object} data - Updated attributes.
 * @param {string} [data.fullName] - User name.
 * @param {string} [data.email] - User email.
 * @param {string} [data.status] - Status update ("Active", "Inactive", "Suspended").
 * @param {string} [data.suspensionReason] - Reason of suspension if status changes.
 * @returns {Promise<import('@prisma/client').User>} Updated user instance.
 */
export const updateUserById = async (id, data) => {
  const { fullName, email, phone, status, role, company, avatar, password, adminRole, permissions, suspensionReason } = data;
  const updateData = {};
  
  const existingUser = await prisma.user.findUnique({
    where: { id: Number(id) }
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const resolvedName = fullName !== undefined ? fullName : data.name;
  if (resolvedName !== undefined) updateData.fullName = resolvedName;
  
  if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : undefined;
  if (phone !== undefined) updateData.phone = phone;
  
  if (status !== undefined) {
    updateData.status = status;
    if (status === "Suspended" && existingUser.status !== "Suspended") {
      updateData.suspendedAt = new Date();
      updateData.unsuspendedAt = null;
      updateData.suspensionReason = suspensionReason || data.suspensionReason || "No reason provided";
    } else if (status !== "Suspended" && existingUser.status === "Suspended") {
      updateData.suspendedAt = null;
      updateData.suspensionReason = null;
      updateData.unsuspendedAt = new Date();
    }
  }
  
  if (role !== undefined) updateData.role = role;
  if (company !== undefined) updateData.company = company;

  if (avatar !== undefined) {
    updateData.avatar = avatar;
  }
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
    updateData.isFirstLogin = false;
  }
  // Sub-admin role and permissions
  if (adminRole !== undefined) {
    updateData.adminRole = adminRole;
  }
  if (permissions !== undefined) {
    updateData.permissions = permissions;
  }
  return await prisma.user.update({
    where: { id: Number(id) },
    data: updateData
  });
};

/**
 * Deletes a user from the system by performing a database transaction.
 * To avoid constraint violations, it performs cascades:
 * 1. Sets clientId: null on Projects.
 * 2. Sets assigneeId: null on Tasks.
 * 3. Deletes Comments posted by user.
 * 4. Deletes Documents uploaded by user.
 * 5. Deletes associated VerificationSessions.
 * 6. Deletes the User profile.
 *
 * @param {number|string} id - ID of user to delete.
 * @returns {Promise<import('@prisma/client').User>} Deleted user instance.
 */
export const deleteUserById = async (id) => {
  const numericId = Number(id);
  return await prisma.$transaction(async (tx) => {
    // 1. Set clientId: null on Projects to avoid foreign key restriction on deletion
    await tx.project.updateMany({
      where: { clientId: numericId },
      data: { clientId: null }
    });

    // 2. Set assigneeId: null on Tasks to avoid foreign key restriction on deletion
    await tx.task.updateMany({
      where: { assigneeId: numericId },
      data: { assigneeId: null }
    });

    // 3. Delete comments posted by this user
    await tx.comment.deleteMany({
      where: { userId: numericId }
    });

    // 4. Delete documents uploaded by this user
    await tx.document.deleteMany({
      where: { uploadedById: numericId }
    });

    // 5. Delete linked verification sessions
    const userToDel = await tx.user.findUnique({ where: { id: numericId } });
    if (userToDel) {
      await tx.verificationSession.deleteMany({
        where: { OR: [{ userId: numericId }, { email: userToDel.email }] }
      });
    }

    // 6. Delete user
    return await tx.user.delete({
      where: { id: numericId }
    });
  });
};
