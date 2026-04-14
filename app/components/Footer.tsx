"use client";

import { BsGithub } from "react-icons/bs";
import { FaLinkedinIn, FaGlobe } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="
      mt-20 border-t border-zinc-200 py-8
      dark:border-zinc-800
    ">
      <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left */}
        <div className="text-center md:text-left">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {new Date().getFullYear()} Built with 🤍 by{" "}
            <span className="font-medium">Sneha Farkya</span>
          </p>

          <p className="text-xs text-zinc-500 mt-1">
            Helping you apply smarter, not harder.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-5">

          <a
            href="https://github.com/snehafarkya"
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center gap-1 text-sm
              text-zinc-600 dark:text-zinc-400
              hover:text-black dark:hover:text-white
              transition hover:underline
            "
          >
            <BsGithub size={16} />
            GitHub
          </a>

          <a
            href="https://linkedin.com/in/sneha-farkya"
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center gap-1 text-sm
              text-zinc-600 dark:text-zinc-400
              hover:text-black dark:hover:text-white
              transition hover:underline
            "
          >
            <FaLinkedinIn size={16} />
            LinkedIn
          </a>

          <a
            href="https://sneha.fyi"
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center gap-1 text-sm
              text-zinc-600 dark:text-zinc-400
              hover:text-black dark:hover:text-white
              transition hover:underline
            "
          >
            <FaGlobe size={16} />
            Portfolio
          </a>

        </div>
      </div>
    </footer>
  );
}