import { AuthBootstrap } from '@/src/components/auth/AuthBootstrap';

/** სტარტი: ვალიდური სესია → home, სხვა შემთხვევაში → login. */
export default function Index() {
  return <AuthBootstrap />;
}
