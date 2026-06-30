type VerificationEmailInput = {
  otp: string;
  type?: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

const emailBackdrop = "https://image.tmdb.org/t/p/original/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg";
const posterImages = [
  "https://image.tmdb.org/t/p/w500/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg",
  "https://image.tmdb.org/t/p/w500/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
  "https://image.tmdb.org/t/p/w500/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg",
  "https://image.tmdb.org/t/p/w500/8eifdha9GQeZAkexgtD45546XKx.jpg",
  "https://image.tmdb.org/t/p/w500/b85bJfrTOSJ7M5Ox0yp4lxIxdG1.jpg",
];

function posterStrip() {
  return posterImages
    .map(
      (src) => `
        <td style="width:20%;padding:0 5px">
          <img src="${src}" alt="" width="160" style="display:block;width:100%;height:184px;object-fit:cover;border-radius:0;border:1px solid rgba(255,255,255,0.16)" />
        </td>
      `
    )
    .join("");
}

function commercialEmailLayout({
  eyebrow,
  title,
  preview,
  body,
  ctaLabel,
  code,
}: {
  eyebrow: string;
  title: string;
  preview: string;
  body: string;
  ctaLabel?: string;
  code: string;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      </head>
      <body style="margin:0;background:#050506;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
        <div style="display:none;max-height:0;overflow:hidden;color:transparent">${preview}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050506;padding:0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:none;overflow:hidden;border-radius:0;background:#0b0b0d;border:0">
                <tr>
                  <td background="${emailBackdrop}" style="background-image:linear-gradient(90deg,rgba(0,0,0,0.94),rgba(0,0,0,0.62)),url('${emailBackdrop}');background-size:cover;background-position:center;padding:42px 38px 34px">
                    <div style="display:inline-block;background:#e50914;color:#fff;border-radius:0;padding:9px 14px;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase">JokaFlix</div>
                    <p style="margin:24px 0 8px;color:#ffb5ba;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase">${eyebrow}</p>
                    <h1 style="margin:0;color:#ffffff !important;font-size:38px;line-height:1.05;font-weight:900;letter-spacing:-0.02em">${title}</h1>
                    <p style="margin:16px 0 0;max-width:460px;color:#ffffff !important;font-size:16px;line-height:1.6">${body}</p>
                    <div style="display:inline-block;margin-top:24px;background:#e50914;color:#ffffff;border-radius:0;padding:14px 22px;font-size:28px;font-weight:900;letter-spacing:0.28em">${code}</div>
                    ${ctaLabel ? `<p style="margin:12px 0 0;color:#ffffff !important;font-size:13px;font-weight:800">${ctaLabel}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 38px 10px;background:#0b0b0d">
                    <p style="margin:0 0 12px;color:#ffffff;font-size:15px;font-weight:900">Featured on your next watch night</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>${posterStrip()}</tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 38px 34px;background:#0b0b0d">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:0;background:rgba(229,9,20,0.1);border:1px solid rgba(229,9,20,0.24)">
                      <tr>
                        <td style="padding:18px">
                          <p style="margin:0;color:#ffffff;font-size:15px;font-weight:900">Your account unlocks ratings, watchlists, and personal picks.</p>
                          <p style="margin:8px 0 0;color:rgba(255,255,255,0.68);font-size:13px;line-height:1.55">Verify once, then keep building your JokaFlix profile across movies and series.</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:20px 0 0;color:rgba(255,255,255,0.48);font-size:12px;line-height:1.55">This one-time code expires soon. Never share it with anyone from outside JokaFlix support.</p>
                    <p style="margin:18px 0 0;color:rgba(255,255,255,0.36);font-size:11px">You received this email because someone created or accessed a JokaFlix account with this address.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function verificationEmailTemplate({ otp, type = "email-verification" }: VerificationEmailInput) {
  const title = type === "sign-in" ? "Your sign-in code is ready." : "Your screen is almost ready.";
  const body =
    type === "sign-in"
      ? "Enter this code to continue signing in and get back to your watchlist, ratings, and recommendations."
      : "Enter this code to finish setting up your profile and start saving the movies and series you want to watch next.";

  return {
    html: commercialEmailLayout({
      eyebrow: "One-time verification code",
      title,
      preview: `Your JokaFlix verification code is ${otp}.`,
      body,
      ctaLabel: "Enter this code in JokaFlix to verify your email.",
      code: otp,
    }),
    text: [
      "Your JokaFlix verification code.",
      body,
      `Code: ${otp}`,
    ].join("\n\n"),
  };
}
