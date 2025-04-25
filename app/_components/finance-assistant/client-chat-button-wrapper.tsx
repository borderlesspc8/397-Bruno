"use client";

import { ChatButton } from "./chat-button";

interface ClientChatButtonWrapperProps {
  month: string;
}

export function ClientChatButtonWrapper({ month }: ClientChatButtonWrapperProps) {
  return <ChatButton month={month} />;
} 