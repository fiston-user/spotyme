import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to search tab as the default
  return <Redirect href="/search" />;
}