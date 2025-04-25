"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { HelpCircle, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

interface TestConnectionButtonProps {
  connectionId: string;
  walletId: string;
  variant?: "icon" | "full" | "text";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Componente reutilizável para testar conexão bancária
 */
export default function TestConnectionButton({
  connectionId,
  walletId,
  variant = "full",
  onSuccess,
  onError
}: TestConnectionButtonProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      console.log("[TEST_CONNECTION_BUTTON] Testando conexão para wallet:", walletId, "connectionId:", connectionId);

      // Chamar o endpoint de teste de conexão
      const response = await fetch(`/api/wallets/${walletId}/test-connection`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || "Conexão testada com sucesso!"
        });
        toast.success(data.message || "Conexão testada com sucesso!");
        if (onSuccess) onSuccess();
      } else {
        // Mensagens específicas para erros conhecidos
        let errorMessage = data.message || data.error || "Falha ao testar conexão";
        
        // Verificar se é um erro de conexão não encontrada
        if (errorMessage.includes("conexão não encontrada") || errorMessage.includes("Conexão não encontrada")) {
          errorMessage = "Conexão não encontrada. Por favor, reconfigure sua conexão bancária.";
        }
        
        // Verificar se é um erro de autenticação
        if (errorMessage.includes("autenticação") || errorMessage.includes("auth") || response.status === 401) {
          errorMessage = "Falha na autenticação. Por favor, reconecte sua conta bancária.";
        }

        setTestResult({
          success: false,
          message: errorMessage
        });
        toast.error(errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      console.error("[TEST_CONNECTION_BUTTON_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao testar conexão";
      setTestResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const renderButton = () => {
    switch (variant) {
      case "icon":
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTest}
            disabled={isTesting}
            className="h-8 w-8"
            title="Testar conexão bancária"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        );
      case "text":
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {isTesting ? "Testando..." : "Testar Conexão"}
          </Button>
        );
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
          >
            {isTesting ? (
              <>
                <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-current animate-spin mr-2" />
                Testando...
              </>
            ) : (
              <>
                <HelpCircle className="h-3 w-3 mr-2" />
                Testar Conexão
              </>
            )}
          </Button>
        );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {renderButton()}
      
      {testResult && (
        <Alert className={`mt-2 ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {testResult.success ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle className={testResult.success ? 'text-green-800' : 'text-red-800'}>
            {testResult.success ? 'Conexão bem-sucedida' : 'Falha na conexão'}
          </AlertTitle>
          <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 