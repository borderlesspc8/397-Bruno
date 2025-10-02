"use client";

import { cn } from "@/app/_lib/utils";
import React from "react";
import { Menu, X, Wallet, Search, UserCircle, CircleHelp, Settings, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItem } from "./types";
import { MenuItemComponent } from "./MenuItem";
import { AddTransactionButton } from '../AddTransactionButton';
import { Session } from "next-auth";
import { useRouter } from "next/navigation";

const AnimatedMotionDiv = motion.div;

interface MobileMenuProps {
  session: Session | null;
  menuItems: MenuItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: MenuItem[];
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  isActive: (item: MenuItem) => boolean;
  isChildActive: (href: string) => boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  session,
  menuItems,
  searchQuery,
  setSearchQuery,
  filteredItems, 
  expandedSections,
  toggleSection,
  isActive,
  isChildActive,
  isMenuOpen,
  setIsMenuOpen,
  handleLogout
}) => {
  return (
    <AnimatePresence mode="wait">
      <AnimatedMotionDiv 
        key="mobile-menu-button"
        className="md:hidden fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full h-14 w-14 shadow-lg bg-primary"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
              
              {/* Indicador de notificações */}
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                3
              </span>
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="left" 
            className="w-[280px] p-0 border-r shadow-2xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    <h1 className="font-bold">Conta Rápida</h1>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9 bg-muted/60 border-muted"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="px-2 py-1 inline-flex items-center justify-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-light border-none bg-gradient-to-r shadow-sm",
                      "w-full justify-between p-2",
                      "from-blue-200/50 to-blue-100/50 text-blue-800",
                      "dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-100",
                    )}
                  >
                    <UserCircle className="h-3.5 w-3.5 mr-1" />
                    <span>{session?.user?.name}</span>
                  </Badge>
                </div>
                
                <div className="w-full mt-3">
                  <AddTransactionButton 
                    fullWidth={true}
                    className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-white"
                    onClick={() => setIsMenuOpen(false)}
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-3">
                <nav className="space-y-1">
                  {(searchQuery ? filteredItems : menuItems).map(item => (
                    <MenuItemComponent
                      key={item.name}
                      item={item}
                      isActive={isActive(item)}
                      isChildActive={isChildActive}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                      collapsed={false}
                      mobile={true}
                      onClickItem={() => setIsMenuOpen(false)}
                    />
                  ))}
                  
                  {searchQuery && filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <CircleHelp className="h-8 w-8 text-muted-foreground/60 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum resultado encontrado para "{searchQuery}"
                      </p>
                    </div>
                  )}
                </nav>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors mb-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "Usuário"} />
                    <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session?.user?.name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email || "exemplo@email.com"}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 justify-start text-sm h-9"
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = '/settings';
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Config.
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1 justify-start text-sm h-9"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </AnimatedMotionDiv>
    </AnimatePresence>
  );
}; 