# Data Flow Overview

## React Query Flow (Server State)

**Component → Hook → API Client → Server → Cache → Component**

1. **Component** calls hook (e.g., `useTrips()`)
2. **Hook** (`hooks/api/useTrips.ts`) uses React Query's `useQuery`/`useMutation`
3. **API Client** (`lib/api/client.ts`) makes HTTP request with auth token
4. **Server** responds with data
5. **Cache** (`lib/react-query/queryClient.ts`) stores response
6. **Component** receives data and re-renders

---

## Redux Flow (Client State)

**Component → Action → Reducer → Store → Selector → Component**

1. **Component** dispatches action via `useAppDispatch()`
2. **Action** (from slice, e.g., `store/slices/authSlice.ts`)
3. **Reducer** updates state in slice
4. **Store** (`store/index.ts`) holds updated state
5. **Selector** (`store/selectors.ts`) extracts specific state
6. **Component** receives state via `useAppSelector()`

---

## File Responsibilities

### **React Query Files**

| File | Purpose |
|------|---------|
| `lib/react-query/queryClient.ts` | Query client config, cache settings, query key factory |
| `lib/api/client.ts` | Axios instance, auth interceptors, token refresh |
| `lib/api/endpoints.ts` | API endpoint URL constants |
| `lib/api/errorHandler.ts` | Parse/log API errors |
| `hooks/api/useTrips.ts` | Trip queries/mutations |
| `hooks/api/useEvents.ts` | Event queries/mutations |
| `hooks/api/useChats.ts` | Chat/message queries/mutations |
| `hooks/api/useAuth.ts` | Auth mutations (login/logout) + Redux integration |

### **Redux Files**

| File | Purpose |
|------|---------|
| `store/index.ts` | Configure store, combine reducers, export types |
| `store/slices/authSlice.ts` | Auth state (user, tokens) + actions |
| `store/slices/uiSlice.ts` | UI state (theme, modals, toasts) + actions |
| `store/slices/appSlice.ts` | App config (preferences, flags) + actions |
| `store/hooks.ts` | Typed `useAppDispatch` & `useAppSelector` |
| `store/selectors.ts` | Memoized selectors for state access |

### **Integration Files**

| File | Purpose |
|------|---------|
| `providers/AppProviders.tsx` | Wraps app with Redux + React Query providers |
| `app/_layout.tsx` | Root layout with provider integration |
| `types/api.ts` | API request/response types |
| `types/state.ts` | Redux state types |
| `lib/storage/index.ts` | AsyncStorage wrapper for persistence |

---

## Key Integration Points

1. **Auth Hook** (`hooks/api/useAuth.ts`): Bridges React Query mutations with Redux state updates
2. **API Client Interceptors**: Reads Redux auth state, injects tokens, handles refresh
3. **Providers**: Redux wraps React Query for proper state access in interceptors

---

## Example: Get Trips API Call

### Simple Usage

```tsx
import { useTrips } from '@/hooks/api/useTrips';

export default function HomeScreen() {
  const { data, isLoading, error, refetch } = useTrips();

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

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

### With Filters

```tsx
const { data } = useTrips({
  page: 1,
  limit: 10,
  status: 'planned',
  sortBy: 'startDate',
});
```

### Create Trip

```tsx
import { useCreateTrip } from '@/hooks/api/useTrips';

function CreateTripButton() {
  const createTrip = useCreateTrip();

  const handleCreate = async () => {
    await createTrip.mutateAsync({
      from: { type: 'city', name: 'San Francisco' },
      to: { type: 'city', name: 'Los Angeles' },
      startDate: '2026-03-01',
      endDate: '2026-03-03',
    });
  };

  return <Button onPress={handleCreate} loading={createTrip.isPending} />;
}
```

---

## Example: Redux State Management

### Reading State

```tsx
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/store/selectors';

function ProfileScreen() {
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return <Text>Welcome, {user?.name}!</Text>;
}
```

### Updating State

```tsx
import { useAppDispatch } from '@/store/hooks';
import { setTheme, toggleModal } from '@/store/slices/uiSlice';

function SettingsScreen() {
  const dispatch = useAppDispatch();

  const changeTheme = () => {
    dispatch(setTheme('dark'));
  };

  const openModal = () => {
    dispatch(toggleModal({ id: 'settings', isOpen: true }));
  };

  return (
    <>
      <Button onPress={changeTheme} title="Dark Mode" />
      <Button onPress={openModal} title="Open Settings" />
    </>
  );
}
```

---

## What the Hook Handles Automatically

✅ **Fetching data**  
✅ **Loading states**  
✅ **Error handling**  
✅ **Caching**  
✅ **Auto-refetch on focus**  
✅ **Pull-to-refresh**  
✅ **Cache invalidation after mutations**  
✅ **Retry logic**  
✅ **Request deduplication**
