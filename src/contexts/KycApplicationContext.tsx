/**
 * KycApplicationContext — Shared state for KYC applications
 * between the wallet KYC flow and admin KYC review queue.
 *
 * In production, this would be replaced by database-backed API calls.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface KycApplication {
  id: string;
  user: string;
  phone: string;
  type: string;
  submitted: string;
  docType: string;
  aiScore: number;
  aiVerdict: "Approved" | "Review" | "Rejected";
  risk: "Low" | "Medium" | "High";
  region: string;
  /* Captured images (data URLs) */
  frontImage: string | null;
  backImage: string | null;
  selfieImage: string | null;
  /* AI sub-scores */
  scores: {
    docQuality: number;
    faceMatch: number;
    liveness: number;
    dataExtract: number;
  };
  /* Extracted data fields */
  extractedData: { label: string; value: string }[];
  /* Admin review status */
  status: "pending" | "approved" | "rejected";
  reviewNote?: string;
}

interface KycContextValue {
  applications: KycApplication[];
  submitApplication: (app: Omit<KycApplication, "id" | "submitted" | "status">) => string;
  reviewApplication: (id: string, decision: "approved" | "rejected", note?: string) => void;
}

const KycApplicationContext = createContext<KycContextValue | null>(null);

export const useKycApplications = () => {
  const ctx = useContext(KycApplicationContext);
  if (!ctx) throw new Error("useKycApplications must be used within KycApplicationProvider");
  return ctx;
};

const STORAGE_KEY = "tesfa_kyc_applications";
const ID_KEY = "tesfa_kyc_next_id";

const loadFromStorage = (): KycApplication[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const loadNextId = (): number => {
  try {
    const raw = localStorage.getItem(ID_KEY);
    return raw ? Number(raw) : 5000;
  } catch { return 5000; }
};

let nextId = loadNextId();

export const KycApplicationProvider = ({ children }: { children: ReactNode }) => {
  const [applications, setApplications] = useState<KycApplication[]>(loadFromStorage);

  // Persist to localStorage whenever applications change
  const persistApps = useCallback((apps: KycApplication[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); } catch {}
  }, []);

  const submitApplication = useCallback((app: Omit<KycApplication, "id" | "submitted" | "status">) => {
    const id = `KYC-${++nextId}`;
    try { localStorage.setItem(ID_KEY, String(nextId)); } catch {}
    const now = new Date();
    const submitted = now.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }) + " " + now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });

    const newApp: KycApplication = {
      ...app,
      id,
      submitted,
      status: "pending",
    };

    setApplications(prev => {
      const updated = [newApp, ...prev];
      persistApps(updated);
      return updated;
    });
    return id;
  }, [persistApps]);

  const reviewApplication = useCallback((id: string, decision: "approved" | "rejected", note?: string) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === id ? { ...app, status: decision, reviewNote: note } : app
      )
    );
  }, []);

  return (
    <KycApplicationContext.Provider value={{ applications, submitApplication, reviewApplication }}>
      {children}
    </KycApplicationContext.Provider>
  );
};
