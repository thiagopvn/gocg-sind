# SIND-GOCG - Sistema de Transcrição para Sindicâncias Militares

Sistema web **serverless** para gerenciamento de sindicâncias militares com transcrição inteligente usando OpenAI Whisper + GPT-4. Otimizado para deploy no **Vercel** como aplicação estática.

## 🚀 Funcionalidades

- **Gestão de Sindicâncias**: Interface completa para criação e acompanhamento de processos
- **Transcrição Inteligente**: Conversão de áudio em texto usando OpenAI Whisper
- **Formatação Automática**: Correção e estruturação profissional via GPT-4
- **Editor Rico**: Interface Quill.js para edição de documentos
- **Armazenamento Firebase**: Sincronização em tempo real de dados
- **Arquitetura Serverless**: Deploy estático no Vercel sem servidor backend

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- Conta OpenAI com API key
- Conta Firebase (opcional, para persistência de dados)

### Configuração da API OpenAI (Serverless Proxy)

**🔒 Nova Arquitetura Serverless Proxy:**
O sistema agora utiliza funções serverless (`/api/transcribe.js` e `/api/enhance-text.js`) como proxy seguro para a OpenAI, eliminando completamente o erro 400 e garantindo máxima segurança.

1. **Para deploy em produção (Vercel):**
   - Configure a variável de ambiente `OPENAI_API_KEY` no painel do Vercel
   - As funções serverless fazem proxy das chamadas OpenAI
   - **Zero configuração cliente**: Não há mais config.js ou chaves expostas

2. **Para desenvolvimento local:**
```bash
# Defina a variável de ambiente no Vercel:
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

### Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd sind-gocg
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure sua chave da OpenAI:**
   - Configure a variável de ambiente `OPENAI_API_KEY` no Vercel
   - O sistema usa funções serverless como proxy seguro para OpenAI

4. **Execute em desenvolvimento:**
```bash
npm run dev
```

5. **Acesse a aplicação:**
   - Abra http://localhost:3000
   - Faça login com: `sindicante@gocg.com` / `Sind123456`

## 🎤 Sistema de Transcrição (Serverless Proxy)

### Como Funciona

O sistema utiliza uma **arquitetura serverless proxy** com fluxo de duas etapas:

1. **Cliente**: Grava áudio e envia para `/api/transcribe`
2. **Proxy Serverless**: Processa áudio via Whisper → formata com GPT-4 → retorna resultado
3. **Cliente**: Recebe texto formatado e insere no editor

### Recursos da Transcrição

- **Gravação em Segmentos**: Processa áudio em chunks de 5 segundos
- **Correção Automática**: Remove vícios de linguagem e hesitações
- **Formatação Jurídica**: Estrutura em formato de pergunta-resposta
- **Terminologia Militar**: Correção automática de termos técnicos
- **Inserção Inteligente**: Texto aparece na posição do cursor

### Comandos de Teclado

- `Ctrl + S`: Salvar documento
- `Ctrl + Enter`: Iniciar/parar transcrição

## 📁 Estrutura do Projeto

```
sind-gocg/
├── public/                     # Arquivos estáticos
│   ├── css/                   # Estilos CSS
│   ├── js/                    # Scripts JavaScript
│   │   ├── transcription.js   # Cliente de transcrição (usa proxy)
│   │   ├── ~~config.js~~      # REMOVIDO - não mais necessário
│   │   ├── database.js        # Integração Firebase
│   │   └── firebase-electron.js # Config Firebase
│   ├── login.html            # Página de login
│   ├── dashboard-simple.html # Dashboard principal
│   ├── sindicancia-detalhes.html # Detalhes da sindicância
│   └── realizar-oitiva.html  # Interface de transcrição
├── .env                      # Variáveis de ambiente (não commitado)
├── package.json             # Dependências do projeto
└── README.md               # Este arquivo
```

## 🔒 Segurança da API Key

### Nova Arquitetura Serverless Proxy (v3.0.0)

O sistema implementa uma **arquitetura serverless proxy completa**:

1. **Funções Serverless Proxy**: `/api/transcribe.js` e `/api/enhance-text.js`
   - Processam áudio e texto diretamente no servidor
   - Acessam `process.env.OPENAI_API_KEY` de forma segura
   - Fazem todas as chamadas OpenAI server-side

2. **Cliente Simplificado**: `transcription.js`
   - Apenas grava áudio e envia para proxy
   - **Não possui mais acesso a chaves API**
   - Recebe resultado final já processado

### Desenvolvimento
- Configure `OPENAI_API_KEY` no Vercel dashboard
- Não há mais necessidade de arquivos `.env` ou `config.js`
- Funções proxy funcionam localmente e em produção

### Produção (Vercel)
- Configure `OPENAI_API_KEY` nas variáveis de ambiente do Vercel
- Funções proxy processam tudo server-side
- **Máxima Segurança**: Chave nunca sai do servidor

### Vantagens
✅ **SEGURANÇA TOTAL**: API key nunca exposta ao cliente
✅ **CONFIABILIDADE**: Processamento server-side elimina erros 400
✅ **MANUTENIBILIDADE**: Lógica OpenAI centralizada no servidor
✅ **PERFORMANCE**: Sem dependências client-side pesadas

## 🚀 Deploy Serverless

### Vercel (Recomendado) - Aplicação Estática

Este projeto é uma **aplicação 100% estática** otimizada para Vercel:

1. **Conecte seu repositório ao Vercel**
   - Vercel detecta automaticamente a pasta `public/` como root
   - Não requer configuração de servidor - arquitetura serverless

2. **Configure a variável de ambiente no Vercel:**
   ```
   OPENAI_API_KEY = sua-chave-openai-aqui
   ```

3. **Deploy automático:**
```bash
# Deploy direto (Vercel CLI)
vercel --prod

# Ou apenas push para branch principal (auto-deploy)
git push origin main
```

### Características Serverless
- **Híbrido**: Arquivos estáticos + funções serverless para OpenAI
- **APIs**: OpenAI via proxy serverless e Firebase direto
- **Zero configuração**: Vercel serve `public/` + executa `/api/` automaticamente
- **HTTPS automático**: Necessário para acesso ao microfone
- **Global CDN**: Distribuição mundial automática
- **Funções Serverless**: `/api/transcribe.js` e `/api/enhance-text.js`

### Deploy Manual Local
```bash
npm run build    # Comando placeholder (arquivos já prontos)
npm run preview  # Testa localmente na porta 8080
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento (Python HTTP na porta 3000)
- `npm run start` - Servidor de produção (Python HTTP na porta 8080)
- `npm run build` - Build para produção (placeholder - arquivos já prontos)
- `npm run preview` - Preview do build (build + start)

## 📋 Uso do Sistema

### Fluxo Típico de Uso

1. **Login** - Acesse com credenciais fornecidas
2. **Dashboard** - Visualize sindicâncias existentes
3. **Nova Oitiva** - Clique em "Realizar Oitiva"
4. **Transcrição** - Use o botão de microfone para iniciar
5. **Edição** - Edite o texto conforme necessário
6. **Salvamento** - Use Ctrl+S ou botão "Salvar"

### Dicas de Uso

- **Qualidade do Áudio**: Use microfone de qualidade para melhores resultados
- **Pausas Naturais**: Fale com pausas para melhor segmentação
- **Revisão**: Sempre revise o texto gerado pela IA
- **Auto-save**: O sistema salva automaticamente a cada 30 segundos

## 🔧 Solução de Problemas

### Problemas de Transcrição

1. **"Transcrição Indisponível"**:
   - Verifique se `OPENAI_API_KEY` está no Vercel dashboard
   - Confirme permissões do microfone no navegador
   - Verifique se `/api/transcribe` está respondendo

2. **"Permission denied"**:
   - Permita acesso ao microfone nas configurações do navegador
   - Use HTTPS em produção (obrigatório para acesso ao microfone)

3. **Erro de API OpenAI**:
   - Verifique se a chave API está válida
   - Confirme que há créditos suficientes na conta OpenAI
   - Verifique conectividade com a internet

### Problemas de Firebase

1. **Dados não salvos**:
   - Verifique configuração Firebase em `firebase-electron.js`
   - Confirme regras de segurança do Firestore

## 📞 Suporte

Para problemas técnicos ou dúvidas:
- Consulte os logs do navegador (F12 > Console)
- Verifique as configurações da API OpenAI
- Confirme permissões do navegador para microfone

## 🔄 Histórico de Versões

### v3.0.0 (Atual) - Arquitetura Serverless Proxy
- ✅ **Correção DEFINITIVA do erro 400 Whisper API**
- ✅ **Arquitetura serverless proxy completa**
- ✅ Funções `/api/transcribe.js` e `/api/enhance-text.js`
- ✅ Processamento server-side de áudio e texto
- ✅ **Segurança máxima**: Chaves API nunca expostas
- ✅ Remoção total do `config.js` inseguro
- ✅ Cliente simplificado (apenas gravação + envio)
- ✅ Logs detalhados server-side para debugging
- ✅ Formato WebM nativo mantido no servidor

### v2.1.0 (Anterior) - Refatoração de Segurança
- ✅ Correção do erro 400 Whisper API
- ✅ Endpoint serverless seguro `/api/get-openai-key`
- ❌ Ainda havia exposição client-side (corrigido em v3.0.0)

### v2.0.0 (Anterior)
- ✅ Migração completa para OpenAI Whisper + GPT-4
- ✅ Formatação jurídica automática
- ✅ Arquitetura 100% serverless otimizada para Vercel
- ✅ Funcionalidade "Melhorar Texto Selecionado" com GPT-4
- ❌ Problema com conversão WAV (corrigido em v2.1.0)

### v1.0.0 (Anterior)
- Sistema original com Google Cloud Speech
- Interface básica de transcrição

---

**Desenvolvido para GOCG - Governo do Estado**  
Sistema de transcrição inteligente para sindicâncias militares.