import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo e descrição */}
          <div className="lg:col-span-2">
            <Image 
              src="/logo.svg" 
              alt="Conta Rápida" 
              width={150} 
              height={40} 
            />
            <p className="mt-4 max-w-[400px] text-muted-foreground">
              Transformando a gestão financeira com tecnologia e simplicidade. 
              Controle suas finanças pessoais e empresariais em um só lugar.
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <a href="https://facebook.com" aria-label="Facebook" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com" aria-label="GitHub" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider">Produto</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/recursos" className="text-muted-foreground hover:text-foreground">Recursos</Link></li>
              <li><Link href="/planos" className="text-muted-foreground hover:text-foreground">Preços</Link></li>
              <li><Link href="/empresas" className="text-muted-foreground hover:text-foreground">Para Empresas</Link></li>
              <li><Link href="/novidades" className="text-muted-foreground hover:text-foreground">Novidades</Link></li>
              <li><Link href="/roadmap" className="text-muted-foreground hover:text-foreground">Roadmap</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/sobre" className="text-muted-foreground hover:text-foreground">Sobre nós</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link href="/carreiras" className="text-muted-foreground hover:text-foreground">Carreiras</Link></li>
              <li><Link href="/contato" className="text-muted-foreground hover:text-foreground">Contato</Link></li>
              <li><Link href="/parcerias" className="text-muted-foreground hover:text-foreground">Parcerias</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider">Suporte</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/ajuda" className="text-muted-foreground hover:text-foreground">Central de Ajuda</Link></li>
              <li><Link href="/tutoriais" className="text-muted-foreground hover:text-foreground">Tutoriais</Link></li>
              <li><Link href="/documentacao" className="text-muted-foreground hover:text-foreground">Documentação</Link></li>
              <li><Link href="/privacidade" className="text-muted-foreground hover:text-foreground">Privacidade</Link></li>
              <li><Link href="/termos" className="text-muted-foreground hover:text-foreground">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Conta Rápida. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 
