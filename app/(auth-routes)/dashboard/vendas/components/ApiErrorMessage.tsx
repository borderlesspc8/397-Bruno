import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Button } from "@/app/_components/ui/button";

interface ApiErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ApiErrorMessage({ message, onRetry }: ApiErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro na comunicação com o servidor</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>{message}</p>
        <div className="flex gap-2 mt-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
              Tentar novamente
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 
