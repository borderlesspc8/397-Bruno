"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { 
  Camera, 
  Loader2, 
  CheckIcon, 
  RefreshCw
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { generateInitials } from "../utils/formatters";
import { AvatarOption } from "../types";

interface AvatarCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<boolean>;
  name: string | null;
  email: string | null;
  currentAvatar: string | null;
  selectedAvatar: string | null;
  selectedColor: string;
  isUploading: boolean;
  uploadAvatarFile: (file: File) => Promise<string | null>;
  selectColor: (color: string) => void;
  colorOptions: Array<{color: string, label: string}>;
  avatarOptions: AvatarOption[];
  setSelectedAvatar: (url: string | null) => void;
}

export const AvatarCustomizer = ({
  isOpen,
  onClose,
  onSave,
  name,
  email,
  currentAvatar,
  selectedAvatar,
  selectedColor,
  isUploading,
  uploadAvatarFile,
  selectColor,
  colorOptions,
  avatarOptions,
  setSelectedAvatar
}: AvatarCustomizerProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = generateInitials(name, email);
  
  // Manipulador de evento para quando um arquivo é selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatarFile(file);
    }
  };
  
  // Manipulador para botão de upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Manipulador para salvar alterações
  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave();
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Personalizar Avatar</DialogTitle>
          <DialogDescription>
            Escolha um avatar predefinido, faça upload de uma imagem ou use suas iniciais com uma cor personalizada.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview do avatar selecionado */}
          <div className="flex flex-col items-center justify-center gap-3">
            <Avatar className={`h-24 w-24 ${!selectedAvatar ? selectedColor : ''}`}>
              <AvatarImage src={selectedAvatar || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedAvatar(null)}
                title="Usar iniciais"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Usar iniciais</span>
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
          
          {/* Opções de avatares predefinidos */}
          <div>
            <h3 className="text-sm font-medium mb-3">Avatares predefinidos</h3>
            <div className="grid grid-cols-4 gap-3">
              {avatarOptions.map(option => (
                <div 
                  key={option.id}
                  className={`
                    relative flex items-center justify-center cursor-pointer 
                    rounded-lg p-2 transition-all hover:bg-muted
                    ${option.src === selectedAvatar ? 'ring-2 ring-primary bg-muted' : ''}
                  `}
                  onClick={() => setSelectedAvatar(option.src || null)}
                >
                  <Avatar className="w-12 h-12">
                    {option.src ? (
                      <AvatarImage src={option.src} />
                    ) : (
                      <AvatarFallback className={selectedColor}>{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  
                  {option.src === selectedAvatar && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Seleção de cores para avatar de iniciais */}
          {!selectedAvatar && (
            <div>
              <h3 className="text-sm font-medium mb-3">Cor de fundo</h3>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(({ color, label }) => (
                  <div 
                    key={color}
                    className={`
                      cursor-pointer rounded-lg p-1 transition-all hover:opacity-90
                      ${color === selectedColor ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => selectColor(color)}
                    title={label}
                  >
                    <div className={`h-8 w-full rounded ${color}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 