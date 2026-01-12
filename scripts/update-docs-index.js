#!/usr/bin/env node

/**
 * Script para gerar automaticamente o índice de documentação
 * 
 * Este script examina a estrutura de diretórios docs/ e gera um arquivo indice.md
 * que contém links para todos os arquivos de documentação organizados por categoria.
 * 
 * Uso: node scripts/update-docs-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual do script (equivalente a __dirname em CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisificar funções do fs
const readdir = fs.promises.readdir;
const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;
const stat = fs.promises.stat;

// Configuração
const docsDir = path.join(__dirname, '..', 'docs');
const indexFilePath = path.join(docsDir, 'indice.md');
const appRootDir = path.join(__dirname, '..', 'app');

// Categorias e seus diretórios correspondentes
const categories = {
  'Documentação Principal': '',
  'Módulos': 'modulos',
  'Arquitetura': 'arquitetura',
  'Integrações': 'integracao',
  'Funcionalidades': 'features',
  'Diretrizes': 'guidelines',
  'Relatórios': 'reports'
};

// Função para extrair título do arquivo markdown
async function extractTitle(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    const lines = data.split('\n');
    
    // Procurar por título no formato "# Título"
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.substring(2).trim();
      }
    }
    
    // Se não encontrar, usar o nome do arquivo sem extensão
    return path.basename(filePath, '.md')
      .replace(/^README-/, '')  // Remove README- prefix
      .replace(/[-_]/g, ' ')    // Replace dashes and underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    return path.basename(filePath, '.md');
  }
}

// Função para encontrar arquivos markdown em um diretório
async function findMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      continue; // Ignorar diretórios
    }
    
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Função para encontrar arquivos README.md em subdiretórios da aplicação
async function findAppReadmes(dir, results = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    // Verificar se há um README.md no diretório atual
    for (const entry of entries) {
      if (entry.isFile() && entry.name === 'README.md') {
        results.push(path.join(dir, entry.name));
        break;
      }
    }
    
    // Procurar em subdiretórios
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const fullPath = path.join(dir, entry.name);
        await findAppReadmes(fullPath, results);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Erro ao ler o diretório ${dir}:`, error);
    return results;
  }
}

// Função principal
async function main() {
  try {
    let output = `# Índice da Documentação

Este índice foi criado para facilitar a navegação pelos documentos de desenvolvimento e documentação do projeto Conta Rápida.

## Estrutura da Documentação\n\n`;

    // Processar categorias
    for (const [category, subdir] of Object.entries(categories)) {
      const categoryDir = subdir ? path.join(docsDir, subdir) : docsDir;
      
      // Verificar se o diretório existe
      try {
        await stat(categoryDir);
      } catch (error) {
        console.log(`Diretório ${categoryDir} não encontrado, pulando...`);
        continue;
      }
      
      // Encontrar arquivos markdown na categoria
      const files = await findMarkdownFiles(categoryDir);
      
      if (files.length === 0) {
        continue;
      }
      
      // Adicionar cabeçalho da categoria
      output += `### ${category}\n`;
      
      // Adicionar links para os arquivos
      for (const file of files) {
        // Ignorar o próprio arquivo de índice
        if (file === indexFilePath) {
          continue;
        }
        
        // Ignorar arquivos de índice de categorias
        if (path.basename(file) === 'index.md') {
          continue;
        }
        
        const relativePath = path.relative(docsDir, file);
        const title = await extractTitle(file);
        
        // Ler os primeiros 200 caracteres para extrair uma descrição
        let description = '';
        try {
          const data = await readFile(file, 'utf8');
          const content = data.replace(/^#.*$/m, '').trim(); // Remover título
          description = content.substring(0, 200)
            .replace(/\n/g, ' ')
            .trim();
          
          // Truncar no último espaço para não cortar palavras
          if (description.length === 200) {
            const lastSpace = description.lastIndexOf(' ');
            if (lastSpace > 150) {
              description = description.substring(0, lastSpace) + '...';
            } else {
              description = description.substring(0, 200) + '...';
            }
          }
        } catch (error) {
          console.log(`Erro ao ler descrição de ${file}:`, error);
        }
        
        // Limitar a descrição a 70 caracteres para o índice
        if (description.length > 70) {
          description = description.substring(0, 70) + '...';
        }
        
        // Criar link com título e descrição
        output += `- [${title}](./${relativePath})${description ? ' - ' + description : ''}\n`;
      }
      
      output += '\n';
    }
    
    // Adicionar seção para READMEs da aplicação
    output += `## Documentação na Aplicação

Além da documentação principal, existem README.md específicos em diversos diretórios da aplicação:\n\n`;
    
    // Encontrar READMEs na aplicação
    const appReadmes = await findAppReadmes(appRootDir);
    
    for (const readmePath of appReadmes) {
      const relativePath = path.relative(path.join(__dirname, '..'), readmePath);
      const dirName = path.dirname(relativePath).split(path.sep).pop();
      const dirDescription = dirName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      output += `- ${dirDescription}: \`${relativePath}\`\n`;
    }
    
    // Escrever o arquivo de índice
    await writeFile(indexFilePath, output);
    
    console.log(`Índice de documentação atualizado: ${indexFilePath}`);
  } catch (error) {
    console.error('Erro ao gerar índice de documentação:', error);
    process.exit(1);
  }
}

main(); 