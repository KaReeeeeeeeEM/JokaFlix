"use client";

import * as React from "react";
import Image from "next/image";
import logo from "../../assets/logo-sub.png";

const SPLASH_KEY = "jokaflix:splash-seen";

export default function SplashScreen() {
  const [visible, setVisible] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY) === "1") return;

    setVisible(true);
    const exitTimer = window.setTimeout(() => setLeaving(true), 2750);
    const removeTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setVisible(false);
    }, 3350);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`jokaflix-splash ${leaving ? "is-leaving" : ""}`} aria-label="Loading JokaFlix">
      <div className="jokaflix-splash-mark">
        <Image src={logo} alt="" width={112} height={112} priority />
      </div>
      <div className="jokaflix-splash-word" aria-hidden="true">
        {"JokaFlix".split("").map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ "--letter-index": index } as React.CSSProperties}>
            {letter}
          </span>
        ))}
      </div>
      <span className="jokaflix-splash-line" />
    </div>
  );
}
