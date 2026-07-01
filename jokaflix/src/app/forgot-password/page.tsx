import { Suspense } from "react";
import ForgotPasswordPage from "../../components/auth/ForgotPasswordPage";

export default function ForgotPasswordRoute() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
