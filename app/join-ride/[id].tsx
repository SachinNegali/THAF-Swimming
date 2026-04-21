import { Redirect, useLocalSearchParams } from 'expo-router';

export default function JoinRideRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/explore?tripId=${id ?? ''}`} />;
}
