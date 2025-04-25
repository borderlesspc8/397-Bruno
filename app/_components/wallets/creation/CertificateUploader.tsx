"use client";

import { useRef, useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";

export type CertificateFile = {
  name: string;
  file: File | null;
  valid: boolean;
  validating: boolean;
  fieldName: "ca" | "cert" | "key";
  description: string;
  path: string;
};

interface CertificateUploaderProps {
  certificates: CertificateFile[];
  onCertificatesChange: (certificates: CertificateFile[]) => void;
}

export function CertificateUploader({ certificates, onCertificatesChange }: CertificateUploaderProps) {
  // Referências para os inputs de arquivo
  const caRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (index: number, file: File | null) => {
    const updatedCertificates = [...certificates];
    
    if (file) {
      // Validar o arquivo aqui
      const maxSize = 1024 * 1024 * 2; // 2MB
      if (file.size > maxSize) {
        toast.error(`O arquivo ${file.name} excede o tamanho máximo de 2MB`);
        return;
      }

      // Validações específicas por tipo de arquivo
      const fieldName = updatedCertificates[index].fieldName;
      if (
        (fieldName === "ca" && !file.name.endsWith(".cer")) ||
        (fieldName === "cert" && !file.name.endsWith(".pem")) ||
        (fieldName === "key" && !file.name.endsWith(".key"))
      ) {
        toast.error(`Formato de arquivo inválido para ${updatedCertificates[index].name}`);
        return;
      }

      // Atualizar o estado com o arquivo válido
      updatedCertificates[index] = {
        ...updatedCertificates[index],
        file,
        valid: true,
        validating: false
      };

      onCertificatesChange(updatedCertificates);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {certificates.map((cert, index) => (
        <Card key={cert.fieldName} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-gray-800">{cert.name}</h4>
                <p className="text-xs text-gray-600">{cert.description}</p>
                <p className="text-xs text-gray-500 mt-1">Caminho: {cert.path}</p>
              </div>
              <div className="flex-shrink-0">
                {cert.validating ? (
                  <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-600 animate-spin" />
                ) : cert.valid ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      if (index === 0 && caRef.current) caRef.current.click();
                      if (index === 1 && certRef.current) certRef.current.click();
                      if (index === 2 && keyRef.current) keyRef.current.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar
                  </Button>
                )}
              </div>
            </div>
            
            {cert.file && (
              <div className="mt-2 text-xs bg-gray-50 p-2 rounded-md border border-gray-200">
                Arquivo: {cert.file.name} ({(cert.file.size / 1024).toFixed(2)} KB)
              </div>
            )}
            
            <input
              type="file"
              className="hidden"
              accept={index === 0 ? ".cer" : index === 1 ? ".pem" : ".key"}
              ref={index === 0 ? caRef : index === 1 ? certRef : keyRef}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(index, file);
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Função utilitária para verificar se todos os certificados são válidos
export function allCertificatesValid(certificates: CertificateFile[]): boolean {
  return certificates.every(cert => cert.valid);
} 