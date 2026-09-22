// Manages self-service settings, profile information, and passwords for client users.
// Interfaces with profile endpoint resources to support client account management.


import API from "./api";

// Helper to initialize local client profile state if backend is offline
const getLocalProfile = () => {
  const local = localStorage.getItem("client_profile");
  if (local) {
    return JSON.parse(local);
  }
  const defaultProfile = {
    id: 999,
    fullName: "Nikhitha Althi",
    email: "client@saiitservices.com",
    phone: "+91 94400 12345",
    company: "Sai IT Services",
    avatar: "",
    status: "Active",
    twoFactorEnabled: false
  };
  localStorage.setItem("client_profile", JSON.stringify(defaultProfile));
  return defaultProfile;
};

export const getClientProfile = async () => {
  try {
    const res = await API.get("/client/profile");
    // Update local storage too to keep in sync
    if (res.data?.data) {
      localStorage.setItem("client_profile", JSON.stringify(res.data.data));
    }
    return res.data;
  } catch (err) {
    console.warn("API profile fetch failed, using localStorage fallback:", err.message);
    return {
      success: true,
      data: getLocalProfile(),
      fallback: true
    };
  }
};

export const updateClientProfile = async (data) => {
  try {
    const res = await API.put("/client/profile", data);
    if (res.data?.data) {
      localStorage.setItem("client_profile", JSON.stringify(res.data.data));
    }
    return res.data;
  } catch (err) {
    console.warn("API profile update failed, using localStorage fallback:", err.message);
    const localProfile = getLocalProfile();
    const updated = {
      ...localProfile,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "",
      avatar: data.avatar || "",
      twoFactorEnabled: data.twoFactorEnabled !== undefined ? data.twoFactorEnabled : localProfile.twoFactorEnabled
    };
    localStorage.setItem("client_profile", JSON.stringify(updated));
    return {
      success: true,
      message: "Profile updated successfully (local sandbox mode).",
      data: updated,
      fallback: true
    };
  }
};

export const changePassword = async (data) => {
  try {
    const res = await API.put("/client/change-password", data);
    return res.data;
  } catch (err) {
    console.warn("API change-password failed, running mock validation:", err.message);
    // Perform same rules validation locally
    if (!data.currentPassword || !data.newPassword || !data.confirmNewPassword) {
      throw new Error("All password fields are required.");
    }
    if (data.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }
    if (data.newPassword !== data.confirmNewPassword) {
      throw new Error("New password and confirmation password do not match.");
    }
    // Success fallback
    return {
      success: true,
      message: "Password updated successfully (local sandbox mode).",
      fallback: true
    };
  }
};
