import { Suspense } from "react";
import VerifyEmailPage from "../../components/auth/VerifyEmailPage";
import { createMetadata } from "../../lib/seo";

export const metadata = createMetadata({
  title: "Verify Email",
  description: "Verify your JokaFlix account email address.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
