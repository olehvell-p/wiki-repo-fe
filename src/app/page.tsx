"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp } from "@phosphor-icons/react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isValidGithubUrl = (url: string): boolean => {
    if (!url) return false;

    // Check if it looks like a URL
    const urlPattern = /^https?:\/\//;
    if (!urlPattern.test(url)) return false;

    // Check if it's a GitHub URL
    const githubPattern =
      /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    return githubPattern.test(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRepoUrl(value);

    // Clear error if input becomes empty or valid
    if (!value || isValidGithubUrl(value)) {
      setError("");
    } else if (value.length > 0) {
      // Show error if input has content but doesn't look like a URL or GitHub repo
      if (!value.startsWith("http")) {
        setError("Please enter a valid URL starting with http:// or https://");
      } else if (!value.includes("github.com")) {
        setError("Please enter a valid GitHub repository URL");
      } else {
        setError("Please enter a valid GitHub repository URL format");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!isValidGithubUrl(repoUrl)) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (response.status === 200) {
        const result = await response.json();
        console.log("Analysis result:", result);

        // Navigate to the repo page with the UUID
        if (result.uuid) {
          router.push(`/repo/${result.uuid}`);
        } else {
          setError("No UUID received from server");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      setError("Can't access the repository. Please check if it's public.");
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonEnabled = isValidGithubUrl(repoUrl) && !isLoading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isButtonEnabled) {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Title */}
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-center text-foreground">
            Wiki Repo Generator
          </h1>
          <span className="text-sm pt-4 text-center text-foreground">
            Generate wiki for any public github repository. 
          </span>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Link to a github repo http://github.com/..."
              value={repoUrl}
              onChange={handleInputChange}
              className={error ? "border-destructive" : ""}
              disabled={isLoading}
              onKeyDown={handleKeyDown}
            />
            <Button
              onClick={handleAnalyze}
              disabled={!isButtonEnabled}
              size="icon"
            >
              <ArrowUp size={32} />
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
      <div className="absolute bottom-0 flex flex-col items-center w-full p-4">
        <span className="text-sm text-center text-foreground">
          Build by Oleh for <a href="https://www.cubic.dev" className="text-blue-500">cubic.dev</a>
        </span>
      </div>
    </div>
  );
}
