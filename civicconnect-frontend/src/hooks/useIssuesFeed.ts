import { useState, useEffect } from "react";
import { IssueService } from "../services/issueService";
import { IssueDocument } from "../types/issue.types";

export const useIssuesFeed = () => {
  const [issues, setIssues] = useState<IssueDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = IssueService.subscribeToIssues(
      (updatedList) => {
        setIssues(updatedList);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { issues, loading, error };
};
