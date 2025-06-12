import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-12 text-sm text-center text-gray-300 bg-black/80">
      <span>
        &copy; {new Date().getFullYear()} JokaFlix. All rights reserved. | Leave a <a href="https://github.com/KaReeeeeeeeEM" className="text-orange-400" target="_blank">star</a> to support.
      </span>
    </footer>
  );
}
