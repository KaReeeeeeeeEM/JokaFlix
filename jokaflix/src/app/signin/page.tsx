import { Suspense } from "react";
import AuthPage from "../../components/auth/AuthPage";
import { createMetadata } from "../../lib/seo";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your JokaFlix account.",
  path: "/signin",
  noIndex: true,
});

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="signin" />
    </Suspense>
  );
}
