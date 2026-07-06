import { Suspense } from "react";
import ForgotPasswordPage from "../../components/auth/ForgotPasswordPage";
import { createMetadata } from "../../lib/seo";

export const metadata = createMetadata({
  title: "Reset Password",
  description: "Reset your JokaFlix account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordRoute() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
