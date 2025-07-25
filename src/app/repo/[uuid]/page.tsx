"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LinkSimple } from "@phosphor-icons/react";
import Link from "next/link";
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
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  RenderCode,
  RenderFileContent,
} from "@/components/ui/renderFileContent";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Markdown from "react-markdown";
import { AskQuestionDialog } from "@/components/ui/ask-question-dialog";
import { getFileName } from "@/lib/utils";
import { useRepoAnalysis } from "@/hooks/use-repo-analysis";

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
  const uuid = params.uuid as string;

  const { repo, error } = useRepoAnalysis({ uuid });
  const [selectedSection, setSelectedSection] = useState<SectionType>("readme");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedKeyFunctionality, setSelectedKeyFunctionality] =
    useState<KeyFunctionality | null>(null);

  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false);

  if (!repo?.name) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mx-auto"></div>
        </div>
      </div>
    );
  }

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
          setSelectedKeyFunctionality={setSelectedKeyFunctionality}
          onAskQuestion={() => setIsAskDialogOpen(true)}
          onLeave={() => router.push("/")}
        />
        <MainScreen
          repo={repo}
          selectedSection={selectedSection}
          selectedFile={selectedFile}
          selectedKeyFunctionality={selectedKeyFunctionality}
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
  repo: RepoAnalysis;
  selectedSection: SectionType;
  selectedFile: File | null;
  selectedKeyFunctionality: KeyFunctionality | null;
}

const MainScreen = ({
  repo,
  selectedSection,
  selectedFile,
  selectedKeyFunctionality,
}: MainScreenProps) => {
  // Function to fetch README content
  const renderContent = () => {
    switch (selectedSection) {
      case "readme":
        return (
          <div className="flex flex-col w-full">
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
          <div className="prose max-w-none ">
            <h2 className="text-2xl font-bold mb-4">{"Overview"}</h2>
            {repo.overview?.oneLiner && (
              <div className="bg-indigo-50 p-6 mb-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">TLDR</h3>
                <p className="text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {repo.overview.oneLiner}
                  </ReactMarkdown>
                </p>
              </div>
            )}
            {repo.overview?.summary && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">More Details</h3>

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
                    size={null}
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
                    {getFileName(selectedKeyFunctionality.referenceFile)}{" "}
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
                              size={null}
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
                              {getFileName(functionality.referenceFile)}{" "}
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
      <div className="flex-1 flex px-12 pt-12 pb-12 justify-center overflow-y-auto">
        <div className="flex max-w-4xl">{renderContent()}</div>
      </div>
    </div>
  );
};

interface SideBarProps {
  repo: RepoAnalysis;
  selectedSection: SectionType;
  selectedFile: File | null;
  selectedKeyFunctionality: KeyFunctionality | null;
  onSectionSelect: (section: SectionType) => void;
  onFileSelect: (file: File | null) => void;
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
                <span>Open in GitHub ↗</span>
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
                            onSectionSelect("entry-points");
                            onFileSelect(file);
                          }}
                          className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                            selectedSection === "file" &&
                            selectedFile?.filePath === file.filePath
                              ? "bg-gray-100 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {getFileName(file.filePath)}
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
                            onSectionSelect("authentication");
                            onFileSelect(file);
                          }}
                          className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                            selectedSection === "file" &&
                            selectedFile?.filePath === file.filePath
                              ? "bg-gray-100 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {getFileName(file.filePath)}
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
                                onSectionSelect("data-model");
                                onFileSelect(file);
                              }}
                              className={`w-full text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
                                selectedSection === "file" &&
                                selectedFile?.filePath === file.filePath
                                  ? "bg-gray-100 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {getFileName(file.filePath)}
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

interface SectionContentProps {
  title: string;
  section?: Section;
  selectedFile: File | null;
  repo: RepoAnalysis;
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
        <div className="flex gap-2">
          <h2 className="text-2xl font-bold mb-4">
            {getFileName(selectedFile.filePath)}
          </h2>
          <Button
            size={null}
            variant="link"
            className="cursor-pointer"
            onClick={() =>
              window.open(
                repo.link +
                  "/blob/" +
                  repo.default_branch +
                  "/" +
                  selectedFile.filePath,
                "_blank"
              )
            }
          >
            <LinkSimple size={20} />
          </Button>
        </div>
        <h3 className="text-lg font-semibold mb-2">Explaination</h3>
        <p className="text-gray-700 pb-4">{selectedFile.explaination}</p>
        <div className={`${bgColor} p-6 rounded-lg`}>
          <RenderCode
            link={
              repo.link +
              "/blob/" +
              repo.default_branch +
              "/" +
              selectedFile.filePath
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
                  size={null}
                  onClick={() =>
                    window.open(
                      repo.link +
                        "/blob/" +
                        repo.default_branch +
                        "/" +
                        file.filePath,
                      "_blank"
                    )
                  }
                >
                  {getFileName(file.filePath)} <LinkSimple size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
