import { useState, useEffect } from 'react';

// Note: Make sure RepoAnalysis type is available globally or import it from your types file

interface UseRepoAnalysisProps {
  uuid: string;
}

interface UseRepoAnalysisReturn {
  repo: RepoAnalysis | null;
  error: string;
}

export const useRepoAnalysis = ({ uuid }: UseRepoAnalysisProps): UseRepoAnalysisReturn => {
  const [repo, setRepo] = useState<RepoAnalysis | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uuid) return;

    const eventSource = new EventSource(`/api/analyze/${uuid}`);

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

    return () => {
      eventSource.close();
    };
  }, [uuid]);

  return { repo, error };
}; 