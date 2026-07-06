import { Suspense } from "react";
import AuthPage from "../../components/auth/AuthPage";
import { createMetadata } from "../../lib/seo";

export const metadata = createMetadata({
  title: "Create Account",
  description: "Create a JokaFlix account to save watch-later picks and ratings.",
  path: "/signup",
  noIndex: true,
});

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="signup" />
    </Suspense>
  );
}
