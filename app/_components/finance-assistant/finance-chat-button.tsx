"use client";

import React, { useState } from 'react';
import { Button } from "@/app/_components/ui/button";
import { BotIcon, MessageSquare, XIcon, SendIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Textarea } from "@/app/_components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "./use-chat";
import { cn } from "@/app/_lib/utils";
import { useToast } from "@/app/_components/ui/use-toast";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FinanceChatButtonProps {
  month?: string;
  className?: string;
}

export function FinanceChatButton({ month, className }: FinanceChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    month,
    onError: () => {
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível enviar sua mensagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        variant="default"
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full fixed bottom-6 right-6 shadow-lg z-50 bg-primary hover:bg-primary/90",
          className
        )}
      >
        {isOpen ? <XIcon className="h-6 w-6" /> : <BotIcon className="h-6 w-6" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 lg:max-w-md"
          >
            <Card className="border shadow-lg overflow-hidden">
              <CardHeader className="p-4 bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BotIcon className="h-5 w-5" />
                  Assistente Financeiro
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="h-[350px] px-4">
                <CardContent className="pt-4 pb-0">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-6">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          Olá! Como posso ajudar com suas finanças hoje?
                        </p>
                      </div>
                    ) : (
                      messages.map((message: ChatMessage, index: number) => (
                        <div 
                          key={index}
                          className={cn(
                            "flex items-start gap-2",
                            message.role === "user" ? "flex-row-reverse" : ""
                          )}
                        >
                          <Avatar className={cn(
                            "h-8 w-8",
                            message.role === "user" ? "bg-primary" : "bg-secondary"
                          )}>
                            <AvatarFallback>
                              {message.role === "user" ? "EU" : "AI"}
                            </AvatarFallback>
                            {message.role === "assistant" && (
                              <AvatarImage src="/ai-assistant.png" alt="Assistente IA" />
                            )}
                          </Avatar>
                          <div className={cn(
                            "rounded-lg p-3 max-w-[80%]",
                            message.role === "user" 
                              ? "bg-primary text-primary-foreground ml-auto" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {isLoading && (
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 bg-secondary">
                          <AvatarFallback>AI</AvatarFallback>
                          <AvatarImage src="/ai-assistant.png" alt="Assistente IA" />
                        </Avatar>
                        <div className="rounded-lg p-3 bg-muted max-w-[80%]">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </ScrollArea>

              <CardFooter className="p-4 border-t">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  className="flex gap-2 w-full"
                >
                  <Textarea
                    placeholder="Digite sua pergunta..."
                    value={input}
                    onChange={handleInputChange}
                    className="min-h-0 resize-none"
                    rows={1}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendIcon className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 