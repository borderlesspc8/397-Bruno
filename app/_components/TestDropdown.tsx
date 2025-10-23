"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";

export function TestDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('TestDropdown renderizado, isOpen:', isOpen);
  
  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      <p>Teste de Dropdown:</p>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline"
            onClick={() => {
              console.log('Botão de teste clicado');
              setIsOpen(!isOpen);
            }}
          >
            Teste Dropdown
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48"
          style={{ 
            zIndex: 99999, 
            position: 'fixed',
            backgroundColor: 'white',
            border: '2px solid blue',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '150px'
          }}
        >
          <DropdownMenuItem onClick={() => console.log('Item 1 clicado')}>
            Item 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Item 2 clicado')}>
            Item 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Item 3 clicado')}>
            Item 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
