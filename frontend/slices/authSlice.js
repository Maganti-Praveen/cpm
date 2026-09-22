// Organizes Redux state for user credentials, tokens, and multi-factor status flags.
// Orchestrates state updates during login, registration, and logout processes.


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../services/authService";

// register
export const register = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.registerUser(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Registration failed");
    }
  }
);

// login
export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.loginUser(data);
      // save token only if not 2fa
      if (res.data?.data?.token) {
        localStorage.setItem("token", res.data.data.token);
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// verify 2fa OTP
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.verify2FA(data);
      if (res.data?.data?.token) {
        localStorage.setItem("token", res.data.data.token);
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Verification failed");
    }
  }
);

// load profile using saved token
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.getProfile();
      return res.data;
    } catch (err) {
      localStorage.removeItem("token");
      return rejectWithValue("Session expired");
    }
  }
);

// update user profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.updateProfile(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Profile update failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    loading: !!localStorage.getItem("token"),
    error: null,
    isAuthenticated: false,
    twoFactorRequired: false,
    twoFactorEmail: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      authService.logoutUser().catch(() => {});
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.twoFactorRequired = false;
      state.twoFactorEmail = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    cancel2FA: (state) => {
      state.twoFactorRequired = false;
      state.twoFactorEmail = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.twoFactorRequired) {
        state.twoFactorRequired = true;
        state.twoFactorEmail = action.payload.email;
      } else {
        state.user = action.payload.data;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.twoFactorRequired = false;
        state.twoFactorEmail = null;
      }
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.twoFactorRequired = false;
      state.twoFactorEmail = null;
    });

    // verifyOtp
    builder.addCase(verifyOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.data;
      state.token = action.payload.data.token;
      state.isAuthenticated = true;
      state.twoFactorRequired = false;
      state.twoFactorEmail = null;
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // load user
    builder.addCase(loadUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.data;
      state.isAuthenticated = true;
    });
    builder.addCase(loadUser.rejected, (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });

    // update profile
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.data;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { logout, clearError, cancel2FA } = authSlice.actions;
export default authSlice.reducer;
