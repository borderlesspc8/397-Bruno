"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Badge } from "@/app/_components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Search, RefreshCcw } from "lucide-react";
import { useToast } from "@/app/_components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Label } from "@/app/_components/ui/label";

interface Meta {
  id: string;
  mesReferencia: string;
  mesReferenciaFormatado: string;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function TabelaMetas() {
  const router = useRouter();
  const { toast } = useToast();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroAno, setFiltroAno] = useState<string>(new Date().getFullYear().toString());
  const [filtroMes, setFiltroMes] = useState<string>("all");
  const [busca, setBusca] = useState<string>("");

  // Buscar metas ao carregar o componente
  useEffect(() => {
    buscarMetas();
  }, [filtroAno, filtroMes]);

  const buscarMetas = async () => {
    setLoading(true);
    try {
      let url = `/api/metas-vendas?ano=${filtroAno}`;
      if (filtroMes && filtroMes !== "all") {
        url += `&mes=${filtroMes}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setMetas(data);
      } else {
        toast({
          title: "Erro ao buscar metas",
          description: data.error || "Ocorreu um erro ao buscar as metas de vendas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
      toast({
        title: "Erro ao buscar metas",
        description: "Ocorreu um erro ao buscar as metas de vendas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirMeta = async (id: string) => {
    try {
      const response = await fetch(`/api/metas-vendas/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Meta excluída",
          description: "Meta de vendas excluída com sucesso.",
        });
        buscarMetas();
      } else {
        const data = await response.json();
        toast({
          title: "Erro ao excluir",
          description: data.error || "Ocorreu um erro ao excluir a meta.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a meta de vendas.",
        variant: "destructive",
      });
    }
  };

  const handleFiltroAnoChange = (valor: string) => {
    setFiltroAno(valor);
  };

  const handleFiltroMesChange = (valor: string) => {
    setFiltroMes(valor);
  };
  
  const editarMeta = (id: string) => {
    router.push(`/metas-vendas/${id}`);
  };

  // Renderizar opções de anos para filtro (últimos 5 anos + atual)
  const renderOpcoesFiltroAno = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    
    for (let i = anoAtual - 5; i <= anoAtual + 1; i++) {
      anos.push(i);
    }
    
    return anos.map((ano) => (
      <SelectItem key={ano} value={ano.toString()}>
        {ano}
      </SelectItem>
    ));
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const metasFiltradas = metas.filter(meta => {
    if (!busca) return true;
    
    const termo = busca.toLowerCase();
    return (
      meta.mesReferenciaFormatado.toLowerCase().includes(termo) ||
      (meta.observacoes && meta.observacoes.toLowerCase().includes(termo))
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas de Vendas</CardTitle>
        <CardDescription>Lista de metas de vendas mensais cadastradas.</CardDescription>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="ano">Ano</Label>
            <Select value={filtroAno} onValueChange={handleFiltroAnoChange}>
              <SelectTrigger id="ano" className="w-32">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent position="popper">
                {renderOpcoesFiltroAno()}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="mes">Mês</Label>
            <Select value={filtroMes} onValueChange={handleFiltroMesChange}>
              <SelectTrigger id="mes" className="w-32">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">Janeiro</SelectItem>
                <SelectItem value="2">Fevereiro</SelectItem>
                <SelectItem value="3">Março</SelectItem>
                <SelectItem value="4">Abril</SelectItem>
                <SelectItem value="5">Maio</SelectItem>
                <SelectItem value="6">Junho</SelectItem>
                <SelectItem value="7">Julho</SelectItem>
                <SelectItem value="8">Agosto</SelectItem>
                <SelectItem value="9">Setembro</SelectItem>
                <SelectItem value="10">Outubro</SelectItem>
                <SelectItem value="11">Novembro</SelectItem>
                <SelectItem value="12">Dezembro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="busca">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  placeholder="Buscar observações..."
                  className="pl-8"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => buscarMetas()}
              title="Atualizar"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma meta de vendas encontrada.</p>
            <p className="text-sm mt-1">
              {busca 
                ? "Tente ajustar seus filtros de busca."
                : "Clique em 'Nova Meta' para começar a registrar suas metas."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Meta Mensal</TableHead>
                  <TableHead className="text-right">Meta Salvio</TableHead>
                  <TableHead className="text-right">Meta Coordenador</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metasFiltradas.map((meta) => (
                  <TableRow key={meta.id}>
                    <TableCell>{meta.mesReferenciaFormatado}</TableCell>
                    <TableCell className="text-right">{formatarValor(meta.metaMensal)}</TableCell>
                    <TableCell className="text-right">{formatarValor(meta.metaSalvio)}</TableCell>
                    <TableCell className="text-right">{formatarValor(meta.metaCoordenador)}</TableCell>
                    <TableCell>
                      {meta.observacoes && meta.observacoes.length > 50
                        ? `${meta.observacoes.substring(0, 50)}...`
                        : meta.observacoes || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editarMeta(meta.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => excluirMeta(meta.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
