"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";
import { EditConnectionDialog } from "./EditConnectionDialog";
import { EditConnectionProps } from "./types";

interface DirectEditButtonProps {
  connectionId: string;
  initialData?: any;
  onSuccess?: () => void;
}

export const DirectEditButton = ({ 
  connectionId,
  initialData,
  onSuccess
}: DirectEditButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        <Pencil className="h-3 w-3 mr-2" />
        Editar Credenciais
      </Button>

      {isDialogOpen && (
        <EditConnectionDialog
          connectionId={connectionId}
          initialData={initialData}
          onSuccess={onSuccess}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}; 
