import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Order Replication",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/logs", label: "Logs" },
  { href: "/config", label: "Config" },
  { href: "/maintenance", label: "Maintenance" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind via CDN — no build step, consistent with the rest of the tool. */}
        <script src="https://cdn.tailwindcss.com" />
      </head>
      <body className="bg-slate-100 text-slate-800">
        <nav className="bg-slate-800 z-10 fixed top-0 w-full">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 h-14">
            <span className="text-white font-semibold mr-4">
              Order Replication
            </span>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* <main className="max-w-6xl mx-auto px-4 py-6">{children}</main> */}
        {children}
      </body>
    </html>
  );
}
