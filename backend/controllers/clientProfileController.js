// Controller logic for managing clientProfile operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { getCache, setCache, invalidateProfile } from "../utils/cache.js";

// GET /api/client/profile
export const getClientProfile = async (req, res) => {
  try {
    const cacheKey = `user:profile:${req.user.id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { theme: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found"
      });
    }

    const responseData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      company: user.company || "",
      avatar: user.avatar || "",
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      themeId: user.themeId,
      theme: user.theme
    };

    await setCache(cacheKey, responseData, 3600);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/client/profile
export const updateClientProfile = async (req, res) => {
  try {
    const { fullName, email, phone, avatar, twoFactorEnabled } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full Name and Email are required fields."
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    // Check email uniqueness if email has changed
    if (email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another account."
        });
      }
    }

    const updateData = {
      fullName,
      email,
      phone: phone || null,
      avatar: avatar || null
    };

    if (twoFactorEnabled !== undefined) {
      updateData.twoFactorEnabled = twoFactorEnabled;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    await invalidateProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        company: updatedUser.company || "",
        avatar: updatedUser.avatar || "",
        status: updatedUser.status,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        themeId: updatedUser.themeId
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/client/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long."
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match."
      });
    }

    // Verify current password matches
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "The current password you entered is incorrect."
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    await invalidateProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
