import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  receivedAt: string; // ISO date
}

interface NotificationState {
  expoPushToken: string | null;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  notifications: NotificationItem[];
}

const initialState: NotificationState = {
  expoPushToken: null,
  permissionStatus: 'undetermined',
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setExpoPushToken: (state, action: PayloadAction<string>) => {
      state.expoPushToken = action.payload;
    },

    setPermissionStatus: (
      state,
      action: PayloadAction<'undetermined' | 'granted' | 'denied'>
    ) => {
      state.permissionStatus = action.payload;
    },

    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.notifications.unshift(action.payload);
      // Keep a reasonable cap in memory
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setExpoPushToken,
  setPermissionStatus,
  addNotification,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
