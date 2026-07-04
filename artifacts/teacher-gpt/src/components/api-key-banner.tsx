import { AlertCircle, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGetAiStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function ApiKeyBanner() {
  const { data: status, isLoading } = useGetAiStatus();

  if (isLoading || !status || status.configured) {
    return null;
  }

  return (
    <Alert variant="destructive" className="m-4 bg-destructive/10 border-destructive/20 text-destructive-foreground">
      <KeyRound className="h-4 w-4" />
      <AlertTitle className="font-semibold tracking-wide">OpenAI API Key Required</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4 text-sm opacity-90">
        <div>
          {status.message || "TeacherGPT requires an OpenAI API key to function. Please add OPENAI_API_KEY to your Replit Secrets."}
        </div>
      </AlertDescription>
    </Alert>
  );
}
