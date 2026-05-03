import { Redirect } from 'expo-router';

/** სტარტი: პირდაპირ მთავარი — ავტორიზაცია მხოლოდ პროფილზე/დაცულ ექშენზე (`RequireAuth`). */
export default function Index() {
  return <Redirect href="/home" />;
}
