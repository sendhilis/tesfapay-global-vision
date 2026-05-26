/**
 * PlatformModule — Route wrapper that mounts a federated ABX module
 * via <ModuleHost/> based on the :moduleId path param.
 *
 * @route /platform/:moduleId
 */
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ModuleHost } from "@/platform/ModuleHost";
import { getModule } from "@/platform/ModuleRegistry";
import AdminBar from "@/components/AdminBar";

export default function PlatformModule() {
  const { moduleId = "" } = useParams();
  const navigate = useNavigate();
  const mod = getModule(moduleId);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Launchpad
          </button>
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {mod?.name ?? moduleId}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ModuleHost moduleId={moduleId} />
      </main>
    </div>
  );
}
