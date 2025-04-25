# Componentes UI do Conta Rápida

Este diretório contém os componentes de UI reutilizáveis da aplicação Conta Rápida.

## Componentes

### DropdownMenu

O componente `DropdownMenu` é baseado no [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) e foi personalizado para a aplicação Conta Rápida.

#### Uso

```jsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/app/_components/ui/dropdown-menu";

export function ExampleMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Abrir Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Item 1</DropdownMenuItem>
        <DropdownMenuItem>Item 2</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### Propriedades do DropdownMenuContent

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| align | `"center" \| "start" \| "end"` | `"center"` | Alinhamento horizontal do menu dropdown em relação ao gatilho |
| sideOffset | `number` | `4` | Espaçamento (em pixels) entre o menu e o gatilho |

> **Nota:** Por padrão, os menus são alinhados ao centro (`align="center"`) para garantir uma experiência de usuário consistente. Para casos específicos onde seja necessário um alinhamento diferente, utilize as propriedades `align="start"` ou `align="end"`.

#### Exemplo com alinhamento personalizado

```jsx
<DropdownMenuContent align="end" sideOffset={8}>
  {/* Conteúdo do menu */}
</DropdownMenuContent>
``` 