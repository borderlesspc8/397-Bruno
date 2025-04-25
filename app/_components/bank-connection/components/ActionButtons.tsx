"use client";

import { Button } from "../../ui/button";
import { RefreshCw } from "lucide-react";
import { ActionButtonsProps } from "../types";

export const ActionButtons = ({
  onCancel,
  onSubmit,
  onTest,
  isSubmitting,
  allFieldsFilled
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-between mt-6 pt-4 border-t">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      
      <div className="flex space-x-2">
        <Button
          onClick={onTest}
          variant="outline"
          disabled={!allFieldsFilled || isSubmitting}
          className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Testar Conexão
        </Button>
        
        <Button
          onClick={onSubmit}
          disabled={!allFieldsFilled || isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}; 