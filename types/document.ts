export type DocumentStatus = "uploaded" | "processing" | "completed" | "failed";
export type DocumentClassification = "pending" | "accepted" | "needs_review" | "rejected" | "failed";

export type DocumentRecord = {
  id: string;
  name: string;
  storageKey: string;
  size: number;
  mimeType: string;
  status: DocumentStatus;
  task: string | null;
  result: string | null;
  provider: string | null;
  error: string | null;
  classification?: DocumentClassification;
  destinationFolder?: string | null;
  validationReasons?: string[];
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
