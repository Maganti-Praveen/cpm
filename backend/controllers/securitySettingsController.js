// Controller logic for managing securitySettings operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";

// fetch global security/2FA settings
export const getSecuritySettings = async (req, res) => {
  try {
    let settings = await prisma.securitySettings.findUnique({
      where: { singletonId: 1 },
    });

    if (!settings) {
      settings = await prisma.securitySettings.create({ data: { singletonId: 1 } });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update global security/2FA settings
export const updateSecuritySettings = async (req, res) => {
  try {
    const { admin2FAEnabled, staff2FAEnabled, client2FAEnabled } = req.body;

    const settings = await prisma.securitySettings.upsert({
      where: { singletonId: 1 },
      update: { admin2FAEnabled, staff2FAEnabled, client2FAEnabled },
      create: { singletonId: 1, admin2FAEnabled, staff2FAEnabled, client2FAEnabled },
    });

    res.json({ success: true, message: "Security settings saved", data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
