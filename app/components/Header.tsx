"use client";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="w-full border-b" role="banner">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">Investy</div>
          <nav aria-label="Main navigation">
            <ul className="flex gap-3 text-sm text-muted-foreground">
              <li><a href="#" className="text-sm text-gray-500 hover:text-gray-900">Research</a></li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
