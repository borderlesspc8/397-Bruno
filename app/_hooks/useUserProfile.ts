import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

/**
 * Hook para carregar e gerenciar o perfil do usuário
 * Inclui tratamento para erro 404 (usuário não encontrado)
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/user/profile');
        
        // Se o usuário não está autenticado (401), apenas definimos como não carregando
        if (response.status === 401) {
          setIsLoading(false);
          return;
        }
        
        // Se o usuário não existe mais (404), forçar logout e redirecionar
        if (response.status === 404) {
          console.error('Usuário autenticado não existe mais no banco de dados');
          
          // Exibir mensagem para o usuário
          toast.error(
            'Sua conta não foi encontrada. Por favor, faça login novamente.',
            { duration: 5000 }
          );
          
          // Realizar logout e redirecionar para tela de login
          await signOut({ redirect: false });
          router.push('/auth');
          return;
        }
        
        // Para outros erros, apenas configuramos o estado de erro
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar perfil');
        }
        
        // Sucesso: armazenar os dados do perfil
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        console.error('Erro ao carregar perfil do usuário:', err);
        setError(err.message || 'Erro ao carregar perfil do usuário');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserProfile();
  }, [router]);
  
  return { profile, isLoading, error, reload: () => setIsLoading(true) };
} 