"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";

export function SimpleDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('SimpleDropdown renderizado, isOpen:', isOpen);
  
  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      <Button 
        variant="outline"
        onClick={() => {
          console.log('Botão clicado, isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
      >
        Dropdown Simples
      </Button>
      
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 99999,
            backgroundColor: 'white',
            border: '2px solid green',
            borderRadius: '8px',
            padding: '8px',
            minWidth: '150px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginTop: '4px'
          }}
        >
          <div 
            style={{ padding: '8px', cursor: 'pointer' }}
            onClick={() => {
              console.log('Item 1 clicado');
              setIsOpen(false);
            }}
          >
            Item 1
          </div>
          <div 
            style={{ padding: '8px', cursor: 'pointer' }}
            onClick={() => {
              console.log('Item 2 clicado');
              setIsOpen(false);
            }}
          >
            Item 2
          </div>
          <div 
            style={{ padding: '8px', cursor: 'pointer' }}
            onClick={() => {
              console.log('Item 3 clicado');
              setIsOpen(false);
            }}
          >
            Item 3
          </div>
        </div>
      )}
    </div>
  );
}
