'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { VendedorImagensService } from "@/app/_services/vendedorImagens";
import DefaultAvatar from "@/app/components/DefaultAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Dialog, DialogContent } from "@/app/_components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Maximize2, Camera, Award } from "lucide-react";
import { formatCurrency } from "@/app/_utils/format";

interface GaleriaVendedoresProps {
  vendedores: Vendedor[];
  onUploadFoto: (vendedor: Vendedor) => void;
}

export function GaleriaVendedores({ vendedores, onUploadFoto }: GaleriaVendedoresProps) {
  const [imagensVendedores, setImagensVendedores] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [imagemAmpliada, setImagemAmpliada] = useState<{
    vendedor: Vendedor;
    url: string;
  } | null>(null);
  const [visualizacao, setVisualizacao] = useState<'grid' | 'lista'>('grid');
  
  // Ordenar vendedores por faturamento
  const vendedoresOrdenados = [...vendedores].sort((a, b) => b.faturamento - a.faturamento);
  
  // Carregar imagens dos vendedores
  useEffect(() => {
    const carregarImagens = async () => {
      setCarregando(true);
      
      try {
        const imagePromises = vendedores.map(async (vendedor) => {
          const imagemUrl = await VendedorImagensService.buscarImagemVendedor(vendedor.id);
          return { id: vendedor.id, url: imagemUrl };
        });
        
        const imagens = await Promise.all(imagePromises);
        
        const imagensMap = imagens.reduce((acc, item) => {
          acc[item.id] = item.url;
          return acc;
        }, {} as Record<string, string>);
        
        setImagensVendedores(imagensMap);
      } catch (error) {
        console.error("Erro ao carregar imagens dos vendedores:", error);
      } finally {
        setCarregando(false);
      }
    };
    
    if (vendedores.length > 0) {
      carregarImagens();
    }
  }, [vendedores]);
  
  // Função para ampliar imagem
  const ampliarImagem = (vendedor: Vendedor) => {
    setImagemAmpliada({
      vendedor,
      url: imagensVendedores[vendedor.id] || '/images/default-avatar.svg'
    });
  };
  
  // Navegar entre imagens na visualização ampliada
  const navegarImagem = (direcao: 'anterior' | 'proxima') => {
    if (!imagemAmpliada) return;
    
    const indiceAtual = vendedoresOrdenados.findIndex(v => v.id === imagemAmpliada.vendedor.id);
    
    if (indiceAtual === -1) return;
    
    let novoIndice: number;
    
    if (direcao === 'anterior') {
      novoIndice = indiceAtual === 0 ? vendedoresOrdenados.length - 1 : indiceAtual - 1;
    } else {
      novoIndice = indiceAtual === vendedoresOrdenados.length - 1 ? 0 : indiceAtual + 1;
    }
    
    const novoVendedor = vendedoresOrdenados[novoIndice];
    
    setImagemAmpliada({
      vendedor: novoVendedor,
      url: imagensVendedores[novoVendedor.id] || '/images/default-avatar.svg'
    });
  };
  
  // Renderizar posição do vendedor
  const renderizarPosicao = (posicao: number) => {
    if (posicao === 0) {
      return (
        <div className="absolute top-2 left-2 bg-amber-500 text-white rounded-full p-1">
          <Award className="h-4 w-4" />
        </div>
      );
    }
    
    return (
      <div className={`absolute top-2 left-2 ${posicao < 3 ? 'bg-amber-500' : 'bg-gray-500'} text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold`}>
        {posicao + 1}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Galeria de Vendedores</CardTitle>
        
        <Tabs defaultValue="grid" value={visualizacao} onValueChange={(v) => setVisualizacao(v as 'grid' | 'lista')}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {carregando ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33]"></div>
          </div>
        ) : (
          <div className={`
            ${visualizacao === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' 
              : 'space-y-4'
            }
          `}>
            {vendedoresOrdenados.map((vendedor, index) => (
              visualizacao === 'grid' ? (
                <div key={vendedor.id} className="relative group">
                  <div className="relative overflow-hidden rounded-lg aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer transition-all duration-300 group-hover:shadow-lg">
                    {renderizarPosicao(index)}
                    
                    <DefaultAvatar 
                      src={imagensVendedores[vendedor.id]}
                      alt={`Foto de ${vendedor.nome}`}
                      size={500}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                      <p className="text-white font-medium text-center mb-2 px-2 truncate w-full">
                        {vendedor.nome}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="rounded-full bg-white/90 hover:bg-white"
                          onClick={() => ampliarImagem(vendedor)}
                        >
                          <Maximize2 className="h-4 w-4 text-gray-800" />
                        </Button>
                        
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="rounded-full bg-white/90 hover:bg-white"
                          onClick={() => onUploadFoto(vendedor)}
                        >
                          <Camera className="h-4 w-4 text-gray-800" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <h4 className="font-medium text-sm truncate">{vendedor.nome}</h4>
                    <p className="text-xs text-muted-foreground">{formatCurrency(vendedor.faturamento)}</p>
                  </div>
                </div>
              ) : (
                <div 
                  key={vendedor.id}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="relative mr-4">
                    <DefaultAvatar 
                      src={imagensVendedores[vendedor.id]}
                      alt={`Foto de ${vendedor.nome}`}
                      size={64}
                      className="border-2 border-[#faba33]"
                    />
                    {index < 3 && (
                      <div className={`absolute -top-1 -right-1 ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'} rounded-full h-5 w-5 flex items-center justify-center text-xs text-white font-bold`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{vendedor.nome}</h4>
                      <span className="text-sm text-muted-foreground">{vendedor.vendas} vendas</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm">{formatCurrency(vendedor.faturamento)}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => ampliarImagem(vendedor)}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => onUploadFoto(vendedor)}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Modal de imagem ampliada */}
      <Dialog open={!!imagemAmpliada} onOpenChange={(open) => !open && setImagemAmpliada(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <div className="flex justify-between items-center absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
              <h3 className="text-white font-medium">
                {imagemAmpliada?.vendedor.nome}
              </h3>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={() => setImagemAmpliada(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="aspect-square relative">
              <img 
                src={imagemAmpliada?.url} 
                alt={`Foto de ${imagemAmpliada?.vendedor.nome}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                }}
              />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex justify-between items-center text-white">
                <div>
                  <p className="text-sm opacity-90">Vendas: {imagemAmpliada?.vendedor.vendas}</p>
                  <p className="text-sm opacity-90">Faturamento: {imagemAmpliada && formatCurrency(imagemAmpliada.vendedor.faturamento)}</p>
                </div>
                
                <Button 
                  variant="secondary" 
                  className="bg-[#faba33] hover:bg-[#e9a92a] text-white"
                  onClick={() => imagemAmpliada && onUploadFoto(imagemAmpliada.vendedor)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Atualizar Foto
                </Button>
              </div>
            </div>
            
            {/* Botões de navegação */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white bg-black/30 hover:bg-black/50"
              onClick={() => navegarImagem('anterior')}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-black/30 hover:bg-black/50"
              onClick={() => navegarImagem('proxima')}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 