import { motion, AnimatePresence } from "framer-motion";
import { FastForward } from "lucide-react";
import { useState, useEffect } from "react";
import { useTypingEffect } from "../../../hooks/useTypingEffect";

export const AboutSection = () => {
  const [aboutContent, setAboutContent] = useState("");
  const { displayedContent, setIsTyping, setDisplayedContent } =
    useTypingEffect(aboutContent);
  const [showSkipButton, setShowSkipButton] = useState(false);

  useEffect(() => {
    const fetchAboutMe = async () => {
      try {
        // Use Vite base URL so this works on Netlify (and any sub-path deploy)
        const base = import.meta.env.BASE_URL || "/";
        const url = `${base.replace(/\/$/, "")}/knowledge/about-me.md`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} when fetching ${url}`);
        }

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        // Netlify SPA fallback often returns index.html (text/html) for missing assets
        const looksLikeHtml =
          contentType.includes("text/html") ||
          text.trimStart().startsWith("<!DOCTYPE html") ||
          text.trimStart().startsWith("<html");

        if (looksLikeHtml) {
          console.error(
            "Fetched HTML instead of markdown. This usually means the file is missing from the deploy output or a SPA redirect is catching the request.",
            { url, contentType }
          );
          setAboutContent(
            "Error: about-me.md was not found in the deployed site (received HTML instead)."
          );
          return;
        }

        setAboutContent(text);
      } catch (error) {
        console.error("Error reading about-me.md:", error);
        setAboutContent("Error loading content...");
      }
    };

    fetchAboutMe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setIsTyping(false);
    setDisplayedContent(aboutContent);
    setShowSkipButton(false);
  };

  return (
    <motion.div
      key="about"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto relative flex flex-col items-center pb-12"
    >
      <div className="terminal-window bg-gray-900 rounded-lg p-6 border border-purple-500/30 w-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="font-mono">
          <span className="text-green-500">➜</span>
          <span className="text-purple-500"> ~/about-me</span>
          <span className="text-white"> cat about-me.md</span>
          <div className="mt-4 text-gray-300 whitespace-pre-line min-h-[200px]">
            {displayedContent}
            <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSkipButton && displayedContent !== aboutContent && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            className="mt-6 px-4 py-2 bg-purple-500 hover:bg-purple-600 
                     rounded-full flex items-center gap-2 text-white shadow-lg 
                     hover:shadow-purple-500/50 transition-all duration-300"
          >
            <FastForward className="w-4 h-4" />
            <span>Skip Typing</span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
