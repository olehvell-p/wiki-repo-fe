import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useSWR from "swr";

import { CopyBlock } from "react-code-blocks";

// Function to convert GitHub blob URL to raw content URL
const convertToRawUrl = (githubUrl: string) => {
  if (githubUrl.includes("github.com") && githubUrl.includes("/blob/")) {
    return githubUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob", "");
  }
  return githubUrl;
};

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const rawUrl = convertToRawUrl(url);
  const response = await fetch(rawUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
};

export const RenderFileContent = ({ link }: { link: string }) => {
  console.log(link);
  const {
    data: content,
    error,
    isLoading,
  } = useSWR(
    link ? link : null, // Only fetch if link exists
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when window regains focus
      revalidateOnReconnect: false, // Don't refetch when network reconnects
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="text-red-700 font-medium">Error loading content:</div>
        <div className="text-red-600 text-sm mt-1">{error.message}</div>
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mb-4 text-gray-900">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-medium mb-2 text-gray-700">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 text-gray-600 leading-relaxed">{children}</p>
        ),
        code: ({ children }) => (
          <code className="bg-gray-100 px-1 py-0.5  rounded text-sm font-mono">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-50 p-8 rounded-lg overflow-x-auto border">
            {children}
          </pre>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="text-gray-600">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export const RenderCode = ({ link }: { link: string }) => {
  const {
    data: content,
    error,
    isLoading,
  } = useSWR(
    link ? link : null, // Only fetch if link exists
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch when window regains focus
      revalidateOnReconnect: false, // Don't refetch when network reconnects
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="text-red-700 font-medium">Error loading content:</div>
        <div className="text-red-600 text-sm mt-1">{error.message}</div>
      </div>
    );
  }
  return (
    <CopyBlock
      text={content || ""}
      language="python"
      showLineNumbers={true}
      wrapLongLines={true}
    />
  );
};
