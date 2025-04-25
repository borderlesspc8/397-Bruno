"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/_components/ui/dialog';
import { 
  Paperclip, 
  Download, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Trash,
  X
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/app/_components/ui/tooltip';
import { Skeleton } from '@/app/_components/ui/skeleton';
import Image from 'next/image';
import { Badge } from '@/app/_components/ui/badge';
import Link from 'next/link';

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: Date;
}

interface TransactionAttachmentsProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => Promise<void>;
  isLoading?: boolean;
  allowDelete?: boolean;
  compact?: boolean;
}

/**
 * Componente para exibir e gerenciar anexos de transações
 */
export function TransactionAttachments({
  attachments,
  onDelete,
  isLoading = false,
  allowDelete = false,
  compact = false
}: TransactionAttachmentsProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Função para obter o ícone apropriado com base no tipo de arquivo
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <ImageIcon className="h-6 w-6 text-blue-500" />;
      case 'pdf':
        return <File className="h-6 w-6 text-red-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-indigo-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Determinar se a imagem pode ser visualizada
  const isViewableImage = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };
  
  // Função para exibir detalhes do anexo
  const showAttachmentDetails = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
  };
  
  // Função para excluir um anexo
  const handleDelete = async (attachmentId: string) => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(attachmentId);
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
    } finally {
      setIsDeleting(false);
      setSelectedAttachment(null);
    }
  };
  
  // Componente de visualização compacto 
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}
        </span>
        
        {attachments.map(attachment => (
          <TooltipProvider key={attachment.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    {getFileIcon(attachment.fileName)}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{attachment.fileName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }
  
  // Componente de visualização padrão
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Paperclip className="h-4 w-4 mr-2" />
            Anexos
          </CardTitle>
          <CardDescription>
            {attachments.length > 0 
              ? `${attachments.length} ${attachments.length === 1 ? 'arquivo anexado' : 'arquivos anexados'}`
              : 'Nenhum arquivo anexado'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Esta transação não possui arquivos anexados
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map(attachment => (
                <div 
                  key={attachment.id} 
                  className="flex items-center p-2 border rounded-md hover:bg-muted/50 transition-colors"
                  onClick={() => showAttachmentDetails(attachment)}
                >
                  <div className="mr-3">
                    {getFileIcon(attachment.fileName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.fileSize 
                        ? `${Math.round(attachment.fileSize / 1024)} KB` 
                        : ''
                      }
                      {attachment.createdAt && (
                        <span className="ml-2">
                          {new Date(attachment.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Link href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal para visualizar detalhes do anexo */}
      <Dialog open={!!selectedAttachment} onOpenChange={(open) => !open && setSelectedAttachment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAttachment && getFileIcon(selectedAttachment.fileName)}
              <span className="truncate max-w-[300px]">
                {selectedAttachment?.fileName || 'Anexo'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedAttachment?.fileSize && (
                <Badge variant="outline" className="mr-2">
                  {Math.round((selectedAttachment.fileSize || 0) / 1024)} KB
                </Badge>
              )}
              {selectedAttachment?.createdAt && (
                <Badge variant="outline">
                  Anexado em {new Date(selectedAttachment.createdAt).toLocaleDateString()}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedAttachment && isViewableImage(selectedAttachment.fileName) ? (
              <div className="flex justify-center">
                <img 
                  src={selectedAttachment.fileUrl} 
                  alt={selectedAttachment.fileName}
                  className="max-h-[400px] max-w-full object-contain rounded-md"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  {selectedAttachment && getFileIcon(selectedAttachment.fileName)}
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Este tipo de arquivo não pode ser visualizado diretamente.
                  Faça o download para abrir.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            {allowDelete && onDelete && selectedAttachment && (
              <Button 
                variant="destructive" 
                onClick={() => selectedAttachment && handleDelete(selectedAttachment.id)}
                disabled={isDeleting}
                className="mr-auto"
              >
                {isDeleting && <Skeleton className="h-4 w-4 mr-2 rounded-full" />}
                <Trash className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            
            {selectedAttachment && (
              <Link href={selectedAttachment.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 