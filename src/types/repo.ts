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
  oneLiner: string;
  keyFunctionality: KeyFunctionality[];
}

interface RepoAnalysis {
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
  cleanName: string;
  filePath: string;
  link: string;
  explaination: string;
}
