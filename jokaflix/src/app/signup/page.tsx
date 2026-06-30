import { Suspense } from "react";
import AuthPage from "../../components/auth/AuthPage";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="signup" />
    </Suspense>
  );
}
