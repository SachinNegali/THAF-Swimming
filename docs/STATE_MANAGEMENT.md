# State Management Setup - Usage Guide

## Overview

This project uses a dual state management approach:
- **React Query** for server state (API calls, caching)
- **Redux Toolkit** for client state (auth, UI, app config)

---

## Quick Start

### 1. Using React Query for API Calls

#### Fetching Data (Queries)

```tsx
import { useTrips } from '@/hooks/api/useTrips';

function TripsScreen() {
  const { data, isLoading, error, refetch } = useTrips({
    page: 1,
    limit: 10,
    status: 'planned',
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <FlatList
      data={data?.data}
      renderItem={({ item }) => <TripCard trip={item} />}
      onRefresh={refetch}
      refreshing={isLoading}
    />
  );
}
```

#### Mutating Data (Mutations)

```tsx
import { useCreateTrip } from '@/hooks/api/useTrips';

function CreateTripScreen() {
  const createTrip = useCreateTrip();

  const handleSubmit = async (formData) => {
    try {
      await createTrip.mutateAsync(formData);
      // Success! Navigate away or show success message
      navigation.goBack();
    } catch (error) {
      // Error is already parsed and user-friendly
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button
        title="Create Trip"
        onPress={handleSubmit}
        loading={createTrip.isPending}
      />
    </Form>
  );
}
```

---

### 2. Using Redux for Client State

#### Reading State

```tsx
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/store/selectors';

function ProfileScreen() {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
    </View>
  );
}
```

#### Dispatching Actions

```tsx
import { useAppDispatch } from '@/store/hooks';
import { toggleModal, setTheme } from '@/store/slices/uiSlice';

function SettingsScreen() {
  const dispatch = useAppDispatch();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    dispatch(setTheme(theme));
  };

  const openModal = () => {
    dispatch(toggleModal({ id: 'settings', isOpen: true }));
  };

  return (
    <View>
      <Button title="Toggle Theme" onPress={() => handleThemeChange('dark')} />
      <Button title="Open Modal" onPress={openModal} />
    </View>
  );
}
```

---

### 3. Authentication Flow

```tsx
import { useLogin, useLogout } from '@/hooks/api/useAuth';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/selectors';

function LoginScreen() {
  const login = useLogin();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login.mutateAsync({ email, password });
      // User is now authenticated, Redux state is updated
      // Navigate to home screen
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <LoginForm onSubmit={handleLogin} loading={login.isPending} />
  );
}

function LogoutButton() {
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    // User is logged out, all state is cleared
  };

  return <Button title="Logout" onPress={handleLogout} />;
}
```

---

### 4. Managing UI State

```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleBottomSheet, addToast } from '@/store/slices/uiSlice';
import { selectBottomSheetState } from '@/store/selectors';

function HomeScreen() {
  const dispatch = useAppDispatch();
  const isSheetOpen = useAppSelector(selectBottomSheetState('tripDetails'));

  const showSuccessToast = () => {
    dispatch(addToast({
      message: 'Trip created successfully!',
      type: 'success',
      duration: 3000,
    }));
  };

  const openTripDetails = () => {
    dispatch(toggleBottomSheet({ id: 'tripDetails', isOpen: true }));
  };

  return (
    <View>
      <Button title="Show Trip Details" onPress={openTripDetails} />
      <BottomSheet
        visible={isSheetOpen}
        onClose={() => dispatch(toggleBottomSheet({ id: 'tripDetails', isOpen: false }))}
      >
        {/* Sheet content */}
      </BottomSheet>
    </View>
  );
}
```

---

### 5. Optimistic Updates

```tsx
import { useUpdateTrip } from '@/hooks/api/useTrips';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/queryClient';

function TripCard({ trip }) {
  const queryClient = useQueryClient();
  const updateTrip = useUpdateTrip();

  const handleStatusChange = async (newStatus: string) => {
    // Optimistically update the UI
    queryClient.setQueryData(queryKeys.trips.detail(trip.id), {
      ...trip,
      status: newStatus,
    });

    try {
      await updateTrip.mutateAsync({
        id: trip.id,
        data: { status: newStatus },
      });
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(trip.id) });
      Alert.alert('Error', error.message);
    }
  };

  return <TripStatusButton onPress={handleStatusChange} />;
}
```

---

## Available Hooks

### React Query Hooks

#### Trips
- `useTrips(filters?)` - Fetch all trips
- `useTrip(id)` - Fetch single trip
- `useCreateTrip()` - Create trip mutation
- `useUpdateTrip()` - Update trip mutation
- `useDeleteTrip()` - Delete trip mutation

#### Events
- `useEvents(filters?)` - Fetch all events
- `useEvent(id)` - Fetch single event
- `useCreateEvent()` - Create event mutation
- `useUpdateEvent()` - Update event mutation
- `useDeleteEvent()` - Delete event mutation
- `useJoinEvent()` - Join event mutation
- `useLeaveEvent()` - Leave event mutation
- `useEventParticipants(eventId)` - Fetch event participants

#### Chats
- `useChats()` - Fetch all chats
- `useChat(id)` - Fetch single chat
- `useCreateChat()` - Create chat mutation
- `useMessages(chatId)` - Fetch messages (auto-refetch every 5s)
- `useSendMessage()` - Send message mutation
- `useDeleteMessage()` - Delete message mutation
- `useMarkChatAsRead()` - Mark chat as read mutation

#### Auth
- `useCurrentUser()` - Fetch current user profile
- `useLogin()` - Login mutation
- `useRegister()` - Register mutation
- `useLogout()` - Logout mutation
- `useSocialLogin(provider)` - Social login mutation

### Redux Hooks

- `useAppDispatch()` - Typed dispatch hook
- `useAppSelector(selector)` - Typed selector hook

---

## Configuration

### API Base URL

Set your API base URL in a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://api.yourapp.com/v1
```

Or it defaults to `http://localhost:3000/api` for development.

### Query Client Settings

Modify `/lib/react-query/queryClient.ts` to adjust:
- `staleTime` - How long data is fresh (default: 5 minutes)
- `gcTime` - Cache retention time (default: 10 minutes)
- `retry` - Number of retry attempts (default: 3)
- `refetchOnWindowFocus` - Auto-refetch on focus (default: true)

---

## Best Practices

1. **Use React Query for server data** - Don't store API responses in Redux
2. **Use Redux for client state** - Auth tokens, UI state, app config
3. **Leverage automatic cache invalidation** - Mutations auto-invalidate related queries
4. **Handle errors gracefully** - All errors are parsed to user-friendly messages
5. **Use optimistic updates** - For better UX on mutations
6. **Memoize selectors** - Use `createSelector` for derived state
7. **Type everything** - Full TypeScript support throughout

---

## Debugging

### Redux DevTools

Redux DevTools are enabled in development mode. Use React Native Debugger or Flipper to inspect state.

### React Query DevTools

React Query DevTools are available in development. Import and use:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your app (development only)
{__DEV__ && <ReactQueryDevtools />}
```

---

## Migration Guide

To migrate existing components:

1. Replace manual API calls with React Query hooks
2. Move server data from Redux to React Query
3. Keep only client state in Redux
4. Update components to use typed hooks
5. Remove manual loading/error state management

Example:

**Before:**
```tsx
const [trips, setTrips] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/trips')
    .then(res => res.json())
    .then(setTrips)
    .finally(() => setLoading(false));
}, []);
```

**After:**
```tsx
const { data, isLoading } = useTrips();
```

---

## Troubleshooting

### "Cannot find module" errors
Run `npm install` to ensure all dependencies are installed.

### Type errors
Ensure your `tsconfig.json` includes the `types` directory.

### API calls failing
Check your `EXPO_PUBLIC_API_URL` environment variable and ensure the API is running.

### State not updating
Check Redux DevTools to verify actions are dispatched correctly.
