"use client";


export default function Footer() {
  return (
    <footer className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-8">
      <div className="overflow-hidden rounded-[28px] bg-[#e50914] p-6 text-black shadow-2xl shadow-[#e50914]/10 md:p-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="max-w-2xl text-2xl font-black leading-tight md:text-4xl">Subscribe to our newsletter to stay updated with the latest news.</h2>
            <p className="mt-4 max-w-xl text-sm text-black/60">JokaFlix keeps the catalog fresh with trending titles, popular shows, and genre picks.</p>
          </div>
          <form className="flex min-w-0 rounded-full bg-black p-1">
            <input className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40" placeholder="Your email" type="email" />
            <button className="rounded-full bg-[#e50914] px-4 text-sm font-bold text-black" type="button">Join</button>
          </form>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-b border-white/10 py-8 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
        <strong className="text-[#e50914]">JokaFlix</strong>
        <span>
          &copy; {new Date().getFullYear()} JokaFlix. All rights reserved. Leave a <a href="https://github.com/KaReeeeeeeeEM" className="text-[#e50914]" target="_blank">star</a> to support.
        </span>
      </div>
    </footer>
  );
}
