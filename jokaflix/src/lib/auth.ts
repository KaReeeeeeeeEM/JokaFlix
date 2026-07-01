import { betterAuth } from "better-auth";
import { emailOTP, username } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { nextCookies } from "better-auth/next-js";
import { pool, query } from "./db";
import { sendEmail } from "./email";
import { verificationEmailTemplate } from "./email-templates";

const configuredBaseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const isDevelopment = process.env.NODE_ENV !== "production";
const isLocalURL = (value: string) => value.startsWith("http://localhost") || value.startsWith("http://127.0.0.1");
const baseURL = isDevelopment && !isLocalURL(configuredBaseURL) ? "http://localhost:3000" : configuredBaseURL;
const passkeyRpID = isDevelopment ? "localhost" : process.env.BETTER_AUTH_RP_ID || new URL(baseURL).hostname;
const authOrigins = [
  baseURL,
  "http://localhost:3000",
  "http://localhost:3003",
  "http://localhost:3004",
  "https://jokaflix.vercel.app",
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
];

async function upsertProfile(user: Record<string, unknown>) {
  await query(
    `
      insert into user_profiles (user_id, nationality, gender)
      values ($1, $2, $3)
      on conflict (user_id) do update set
        nationality = excluded.nationality,
        gender = excluded.gender,
        updated_at = now()
    `,
    [user.id, user.nationality || null, user.gender || null]
  );
}

export const auth = betterAuth({
  appName: "JokaFlix",
  baseURL,
  database: pool,
  trustedOrigins: authOrigins,
  user: {
    additionalFields: {
      nationality: {
        type: "string",
        required: false,
        returned: true,
      },
      gender: {
        type: "string",
        required: false,
        returned: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await upsertProfile(user);
        },
      },
      update: {
        async after(user) {
          if (user.id) await upsertProfile(user);
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const template = verificationEmailTemplate({ otp, type });
        const subject =
          type === "sign-in"
            ? "Your JokaFlix sign-in code"
            : type === "forget-password"
              ? "Your JokaFlix password reset code"
              : "Your JokaFlix verification code";
        await sendEmail({
          to: email,
          subject,
          html: template.html,
          text: template.text,
        });
      },
    }),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 24,
    }),
    passkey({
      rpName: "JokaFlix",
      rpID: passkeyRpID,
      origin: authOrigins,
    }),
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
