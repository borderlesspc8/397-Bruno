import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeToggle } from '@/app/_components/theme-toggle';

// Mock do hook useTheme
jest.mock('@/app/_components/client-theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
    systemTheme: 'light',
    mounted: true
  })
}));

// Mock dos componentes UI que estão causando problemas
jest.mock('@/app/_components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button data-testid="dropdown-item" onClick={onClick}>{children}</button>
  ),
}));

// Mock do componente Button
jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => (
    <button data-testid="theme-button" {...props}>{children}</button>
  ),
}));

// Mock do componente Tooltip
jest.mock('@/app/_components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => <div>{children}</div>,
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o botão de alternar tema', () => {
    render(<ThemeToggle />);
    expect(screen.getByTestId('theme-button')).toBeInTheDocument();
    const alterarTemaElements = screen.getAllByText('Alterar tema');
    expect(alterarTemaElements.length).toBeGreaterThan(0);
    expect(alterarTemaElements[0]).toBeInTheDocument();
  });

  it('exibe o ícone correto baseado no tema', () => {
    // Configuração para tema claro (padrão no mock)
    render(<ThemeToggle />);
    
    // No tema claro, deve mostrar o ícone de sol (verificando pela classe)
    const svgIcon = document.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon?.classList.contains('lucide-sun')).toBe(true);
    
    // Não testamos o ícone do tema escuro pois precisaríamos mudar o mock do useTheme
    // e re-renderizar o componente, o que é melhor fazer em um teste separado
  });

  it('renderiza corretamente os itens do menu', () => {
    const { container } = render(<ThemeToggle />);
    
    // Verificamos se os elementos filhos do dropdown-menu estão presentes
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    
    // Verificamos se os itens do menu estão presentes
    const menuItems = screen.getAllByTestId('dropdown-item');
    expect(menuItems.length).toBe(3); // Deve ter 3 itens: Claro, Escuro e Sistema
    
    // Verifica se os textos dos itens estão presentes
    expect(screen.getByText('Claro')).toBeInTheDocument();
    expect(screen.getByText('Escuro')).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });
  
  it('chama setTheme com o tema correto ao clicar nos itens', () => {
    // Criamos um mock para a função setTheme
    const setThemeMock = jest.fn();
    
    // Substituímos temporariamente o mock do useTheme para testar a interação
    jest.spyOn(require('@/app/_components/client-theme-provider'), 'useTheme').mockImplementation(() => ({
      theme: 'light',
      setTheme: setThemeMock,
      resolvedTheme: 'light',
      systemTheme: 'light',
      mounted: true
    }));
    
    render(<ThemeToggle />);
    
    // Obtém todos os itens do menu
    const menuItems = screen.getAllByTestId('dropdown-item');
    
    // Clica no segundo item (tema escuro)
    fireEvent.click(menuItems[1]);
    
    // Verifica se setTheme foi chamado com 'dark'
    expect(setThemeMock).toHaveBeenCalledWith('dark');
    
    // Clica no terceiro item (tema sistema)
    fireEvent.click(menuItems[2]);
    
    // Verifica se setTheme foi chamado com 'system'
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });
}); 