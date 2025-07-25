"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  GithubLogo,
  LinkIcon,
  LinkSimple,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RenderFileContent } from "@/components/ui/renderFileContent";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Markdown from "react-markdown";
import { AskQuestionDialog } from "@/components/ui/ask-question-dialog";

interface Section {
  summary: string;
  relevantFiles: File[];
}

interface KeyFunctionality {
  veryShortDescription: string;
  description: string;
  referenceFile: string;
}

interface Overview {
  summary: string;
  keyFunctionality: KeyFunctionality[];
}

interface RepoData {
  repo_id: string;
  name: string;
  owner: string;
  has_readme: boolean;
  readme?: string;
  default_branch: string;
  link: string;
  description?: string;
  overview?: Overview;
  auth_analysis?: Section;
  data_model_analysis?: Section;
  entry_points?: Section;
}

interface File {
  fileName: string;
  link: string;
  explaination: string;
}

type SectionType =
  | "readme"
  | "overview"
  | "how-to-use"
  | "authentication"
  | "data-model"
  | "github-link"
  | "file"
  | "key-functionality"
  | "entry-points";

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = params.uuid as string;

  const [repo, setRepo] = useState<RepoData | null>(null);
  const [error, setError] = useState("");
  const [selectedSection, setSelectedSection] = useState<SectionType>("readme");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>("");
  const [readmeLoading, setReadmeLoading] = useState<boolean>(false);
  const [readmeError, setReadmeError] = useState<string>("");
  const [selectedKeyFunctionality, setSelectedKeyFunctionality] =
    useState<KeyFunctionality | null>(null);
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);

  // EventSource for SSE
  useEffect(() => {
    if (!uuid) return;

    const eventSource = new EventSource(
      `/api/analyze/${uuid}`
    );

    eventSource.onopen = () => {
      console.log("SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("data", event.data);
        console.log("Received SSE data:", data);

        switch (data.event_type) {
          case "start":
            setRepo(data);
            break;

          case "overview":
            setRepo((prev) =>
              prev
                ? {
                    ...prev,
                    overview: JSON.parse(data.message),
                  }
                : null
            );
            break;

          case "readme":
            setRepo((prev) =>
              prev
                ? {
                    ...prev,
                    has_readme: data.message["has_readme"],
                    readme: data.message["readme"],
                  }
                : null
            );
            break;

          case "auth_analysis":
            setRepo((prev) =>
              prev ? { ...prev, auth_analysis: JSON.parse(data.message) } : null
            );
            break;

          case "data_model_analysis":
            setRepo((prev) =>
              prev
                ? { ...prev, data_model_analysis: JSON.parse(data.message) }
                : null
            );
            break;

          case "entry_points":
            setRepo((prev) =>
              prev ? { ...prev, entry_points: JSON.parse(data.message) } : null
            );
            break;

          case "completed":
            console.log("Analysis completed:", data.message);
            eventSource.close();
            break;

          case "error":
            setError(data.message);
            eventSource.close();
            break;

          default:
            console.log("Unknown event type:", data.event_type);
        }
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setError("Failed to parse analysis data");
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
    };
  }, [uuid]);

  if (!repo?.name) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  console.log("repo", repo);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Analysis Failed
          </h1>
          <p className="text-muted-foreground"> ffas {error}</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex border overflow-hidden">
      <SidebarProvider>
        <SideBar
          repo={repo}
          selectedSection={selectedSection}
          selectedFile={selectedFile}
          selectedKeyFunctionality={selectedKeyFunctionality}
          onSectionSelect={setSelectedSection}
          onFileSelect={setSelectedFile}
          setReadmeContent={setReadmeContent}
          setSelectedKeyFunctionality={setSelectedKeyFunctionality}
          onAskQuestion={() => setIsAskDialogOpen(true)}
          onLeave={() => router.push("/")}
        />
        <MainScreen
          repo={repo}
          selectedSection={selectedSection}
          selectedFile={selectedFile}
          selectedKeyFunctionality={selectedKeyFunctionality}
          readmeContent={readmeContent}
          readmeLoading={readmeLoading}
          readmeError={readmeError}
          setReadmeContent={setReadmeContent}
          setReadmeLoading={setReadmeLoading}
          setReadmeError={setReadmeError}
        />
      </SidebarProvider>

      <AskQuestionDialog
        isOpen={isAskDialogOpen}
        onOpenChange={setIsAskDialogOpen}
        repoUuid={uuid}
      />
    </div>
  );
}

interface MainScreenProps {
  repo: RepoData;
  selectedSection: SectionType;
  selectedFile: File | null;
  selectedKeyFunctionality: KeyFunctionality | null;
  readmeContent: string;
  readmeLoading: boolean;
  readmeError: string;
  setReadmeContent: (content: string) => void;
  setReadmeLoading: (loading: boolean) => void;
  setReadmeError: (error: string) => void;
}

// Reusable component for sections with summary and files
interface SectionContentProps {
  title: string;
  section?: Section;
  selectedFile: File | null;
  repo: RepoData;
  bgColor: string;
}

const SectionContent = ({
  title,
  section,
  selectedFile,
  repo,
  bgColor,
}: SectionContentProps) => {
  if (selectedFile) {
    return (
      <div className="">
        <div className="flex ">
          <h2 className="text-2xl font-bold mb-4">{selectedFile.fileName}</h2>
          <Button
            variant="link"
            className="cursor-pointer"
            onClick={() =>
              window.open(
                repo.link +
                  "/blob/" +
                  repo.default_branch +
                  "/" +
                  selectedFile.fileName,
                "_blank"
              )
            }
          >
            <LinkSimple size={16} />
          </Button>
        </div>
        <h3 className="text-lg font-semibold mb-2">Explaination</h3>
        <p className="text-gray-700 pb-4">{selectedFile.explaination}</p>
        <div className={`${bgColor} p-6 rounded-lg`}>
          <RenderFileContent
            link={
              repo.link +
              "/blob/" +
              repo.default_branch +
              "/" +
              selectedFile.fileName
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {section && (
        <div className={`${bgColor} p-6 rounded-lg`}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {section && section.relevantFiles.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold mb-2">Reference Files</h3>
          <div className="flex gap-4">
            {section.relevantFiles.map((file, index) => (
              <div key={index} className="">
                <Button
                  variant="link"
                  onClick={() =>
                    window.open(
                      repo.link +
                        "/blob/" +
                        repo.default_branch +
                        "/" +
                        file.fileName,
                      "_blank"
                    )
                  }
                >
                  {file.fileName} <LinkSimple size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MainScreen = ({
  repo,
  selectedSection,
  selectedFile,
  selectedKeyFunctionality,
  setReadmeContent,
  setReadmeLoading,
  setReadmeError,
}: MainScreenProps) => {
  // Function to convert GitHub blob URL to raw content URL
  const convertToRawUrl = (githubUrl: string) => {
    return githubUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  };

  // Function to fetch README content
  const fetchReadmeContent = async (readmeUrl: string) => {
    if (!readmeUrl) return;

    setReadmeLoading(true);
    setReadmeError("");

    try {
      const rawUrl = convertToRawUrl(readmeUrl);
      const response = await fetch(rawUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch README: ${response.statusText}`);
      }

      const content = await response.text();
      setReadmeContent(content);
    } catch (error) {
      console.error("Error fetching README:", error);
      setReadmeError(
        error instanceof Error ? error.message : "Failed to fetch README"
      );
    } finally {
      setReadmeLoading(false);
    }
  };

  const renderContent = () => {
    switch (selectedSection) {
      case "readme":
        return (
          <div className="flex flex-col items-center w-full mx-auto">
            {repo.has_readme === undefined ? (
              <div className="flex items-center justify-center space-x-2 p-6 bg-gray-50 rounded-lg">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                <span className="text-gray-600">Loading readme...</span>
              </div>
            ) : repo.has_readme === false ? (
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-center">
                  This repo doesn&apos;t have a readme file.
                  <br />
                  Please finish for AI wiki to generate a summary.
                </span>
              </div>
            ) : (
              <RenderFileContent
                link={
                  repo.link + "/blob/" + repo.default_branch + "/" + repo.readme
                }
              />
            )}
          </div>
        );

      case "overview":
        return (
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            {repo.overview?.summary && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {repo.overview.summary}
                    </ReactMarkdown>
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "key-functionality":
        if (selectedKeyFunctionality) {
          return (
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4">
                {selectedKeyFunctionality.veryShortDescription}
              </h2>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">
                    {selectedKeyFunctionality.description}
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-semibold mb-2">Reference File</h4>
                  <Button
                    variant="link"
                    onClick={() =>
                      window.open(
                        repo.link +
                          "/blob/" +
                          repo.default_branch +
                          "/" +
                          selectedKeyFunctionality.referenceFile,
                        "_blank"
                      )
                    }
                  >
                    {selectedKeyFunctionality.referenceFile}{" "}
                    <LinkSimple size={14} />
                  </Button>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold mb-4">Key Functionality</h2>
              {repo.overview?.keyFunctionality && (
                <div className="space-y-4">
                  {repo.overview.keyFunctionality.map(
                    (functionality, index) => (
                      <div key={index} className="bg-indigo-50 p-6 rounded-lg">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">
                            {functionality.veryShortDescription}
                          </h3>
                          <p className="text-gray-700">
                            {functionality.description}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-md font-semibold mb-2">
                            Reference File
                          </h4>
                          <p className="text-gray-600">
                            <Button
                              variant="link"
                              onClick={() =>
                                window.open(
                                  repo.link +
                                    "/blob/" +
                                    repo.default_branch +
                                    "/" +
                                    functionality.referenceFile,
                                  "_blank"
                                )
                              }
                            >
                              {functionality.referenceFile}{" "}
                              <LinkSimple size={14} />
                            </Button>
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        }

      case "entry-points":
        return (
          <SectionContent
            title="Entry Points"
            section={repo.entry_points}
            selectedFile={selectedFile}
            repo={repo}
            bgColor="bg-green-50"
          />
        );

      case "authentication":
        return (
          <SectionContent
            title="Authentication"
            section={repo.auth_analysis}
            selectedFile={selectedFile}
            repo={repo}
            bgColor="bg-purple-50"
          />
        );

      case "data-model":
        return (
          <SectionContent
            title="Data Model"
            section={repo.data_model_analysis}
            selectedFile={selectedFile}
            repo={repo}
            bgColor="bg-orange-50"
          />
        );

      case "github-link":
        return (
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">GitHub Repository</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-4">
                Visit the GitHub repository for the latest code, issues, and
                contributions.
              </p>
              <Button
                onClick={() => window.open(repo.link, "_blank")}
                className="flex items-center space-x-2"
              >
                <GithubLogo size={16} />
                <span>Open on GitHub</span>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header with title and status */}
      <header className="sticky top-0 z-10 flex w-full bg-background flex-col border-b items-start gap-4 pb-4 pl-12 pt-12 backdrop-blur-sm">
        <div className="flex gap-4">
          <span className="text-4xl font-bold">{repo.name}</span>
          <Button size="icon" onClick={() => window.open(repo.link, "_blank")}>
            <LinkSimple size={12} />
          </Button>
        </div>
        <span className="text-12-12 w-2/3">{repo.description}</span>
      </header>

      {/* CONTENT */}
      <div className="flex-1 flex px-12 pt-12 pb-12 h-full w-full  justify-center overflow-y-auto">
        <div className="flex max-w-4xl justify-center">{renderContent()}</div>
      </div>
    </div>
  );
};

interface SideBarProps {
  repo: RepoData;
  selectedSection: SectionType;
  selectedFile: File | null;
  selectedKeyFunctionality: KeyFunctionality | null;
  onSectionSelect: (section: SectionType) => void;
  onFileSelect: (file: File | null) => void;
  setReadmeContent: (content: string) => void;
  setSelectedKeyFunctionality: (functionality: KeyFunctionality | null) => void;
  onAskQuestion: () => void;
  onLeave: () => void;
}

const SideBar = ({
  repo,
  selectedSection,
  selectedFile,
  selectedKeyFunctionality,
  onSectionSelect,
  onFileSelect,
  setReadmeContent,
  setSelectedKeyFunctionality,
  onAskQuestion,
  onLeave,
}: SideBarProps) => {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center pt-4">
        <div className="flex items-center">
          <Button variant="outline" onClick={onAskQuestion}>
            <div className="flex  gap-2">
              <span>Ask Question (CMD + K)</span>
            </div>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-20">
        <SidebarGroup>
          <SidebarGroupLabel>From the repo</SidebarGroupLabel>
          <SidebarMenuItem key={"ReadMe"}>
            <SidebarMenuButton asChild isActive={selectedSection === "readme"}>
              <button onClick={() => onSectionSelect("readme")}>
                <span>ReadMe</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key={"GitHubLink"}>
            <SidebarMenuButton
              asChild
              isActive={selectedSection === "github-link"}
            >
              <button onClick={() => window.open(repo.link, "_blank")}>
                <span>Open in GitHub</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>AI generated wiki</SidebarGroupLabel>
          <SidebarMenuItem key={"Overview"}>
            <SidebarMenuButton
              asChild
              isActive={selectedSection === "overview"}
            >
              <button
                disabled={!repo.overview}
                onClick={() => {
                  onSectionSelect("overview");
                  setReadmeContent(repo.overview?.summary ?? "");
                }}
                className={repo.overview ? "" : "opacity-50"}
              >
                <span>Overview</span>
                {!repo.overview && (
                  <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                )}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key={"Key Functionality"}>
            <Collapsible className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={selectedSection === "key-functionality"}
                  asChild
                >
                  <button
                    disabled={!repo.overview}
                    onClick={() => {
                      setSelectedKeyFunctionality(null);
                      onSectionSelect("key-functionality");
                    }}
                    className={repo.overview ? "" : "opacity-50"}
                  >
                    <span>Key Functionality</span>
                    {!repo.overview && (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    )}
                  </button>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {repo.overview?.keyFunctionality && (
                  <SidebarMenuSub>
                    {repo.overview.keyFunctionality.map(
                      (keyFunctionality, index) => (
                        <SidebarMenuSubItem key={index}>
                          <button
                            onClick={() => {
                              setSelectedKeyFunctionality(keyFunctionality);
                              onSectionSelect("key-functionality");
                            }}
                            className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                              selectedSection === "key-functionality" &&
                              selectedKeyFunctionality?.veryShortDescription ===
                                keyFunctionality.veryShortDescription
                                ? "bg-gray-100 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {keyFunctionality.veryShortDescription}
                          </button>
                        </SidebarMenuSubItem>
                      )
                    )}
                  </SidebarMenuSub>
                )}
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
          <SidebarMenuItem key={"Entry Points"}>
            <Collapsible className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  asChild
                  isActive={selectedSection === "entry-points"}
                >
                  <button
                    disabled={!repo.entry_points}
                    onClick={() => {
                      onFileSelect(null);
                      onSectionSelect("entry-points");
                    }}
                    className={repo.entry_points ? "" : "opacity-50"}
                  >
                    <span>Entry Points</span>
                    {!repo.entry_points && (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    )}
                  </button>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {repo.entry_points && repo.entry_points.relevantFiles && (
                  <SidebarMenuSub>
                    {repo.entry_points.relevantFiles.map((file, index) => (
                      <SidebarMenuSubItem key={index}>
                        <button
                          onClick={() => {
                            onFileSelect(file);
                          }}
                          className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                            selectedSection === "file" &&
                            selectedFile?.fileName === file.fileName
                              ? "bg-gray-100 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {file.fileName}
                        </button>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
          <SidebarMenuItem key={"Authentication"}>
            <Collapsible className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  asChild
                  isActive={selectedSection === "authentication"}
                >
                  <button
                    disabled={!repo.auth_analysis}
                    onClick={() => {
                      onFileSelect(null);
                      onSectionSelect("authentication");
                    }}
                    className={repo.auth_analysis ? "" : "opacity-50"}
                  >
                    <span>Authentication</span>
                    {!repo.auth_analysis && (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    )}
                  </button>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {repo.auth_analysis && repo.auth_analysis.relevantFiles && (
                  <SidebarMenuSub>
                    {repo.auth_analysis.relevantFiles.map((file, index) => (
                      <SidebarMenuSubItem key={index}>
                        <button
                          onClick={() => {
                            onSectionSelect("file");
                            onFileSelect(file);
                          }}
                          className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                            selectedSection === "file" &&
                            selectedFile?.fileName === file.fileName
                              ? "bg-gray-100 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {file.fileName}
                        </button>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
          <SidebarMenuItem key={"Data Model"}>
            <Collapsible className="group/collapsible">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  asChild
                  isActive={selectedSection === "data-model"}
                >
                  <button
                    disabled={!repo.data_model_analysis}
                    onClick={() => {
                      onFileSelect(null);
                      onSectionSelect("data-model");
                    }}
                    className={repo.data_model_analysis ? "" : "opacity-50"}
                  >
                    <span>Data Model</span>
                    {!repo.data_model_analysis && (
                      <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    )}
                  </button>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {repo.data_model_analysis &&
                  repo.data_model_analysis.relevantFiles && (
                    <SidebarMenuSub>
                      {repo.data_model_analysis.relevantFiles.map(
                        (file, index) => (
                          <SidebarMenuSubItem key={index}>
                            <button
                              onClick={() => {
                                onSectionSelect("file");
                                onFileSelect(file);
                              }}
                              className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                                selectedSection === "file" &&
                                selectedFile?.fileName === file.fileName
                                  ? "bg-gray-100 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {file.fileName}
                            </button>
                          </SidebarMenuSubItem>
                        )
                      )}
                    </SidebarMenuSub>
                  )}
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex gap-4">
        <SidebarMenuItem key={"Leave"}>
          <SidebarMenuButton asChild>
            <Button onClick={onLeave}>Leave</Button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
};
