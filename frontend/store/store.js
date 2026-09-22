// Combines state slice reducers and configures Redux store middleware.
// Serves as the central state library for the React client.


import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
