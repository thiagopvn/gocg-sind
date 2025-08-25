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

### Configuração da API OpenAI (Método Seguro)

**🔒 Nova Arquitetura de Segurança:**
O sistema agora utiliza um endpoint serverless seguro (`/api/get-openai-key`) para obter a chave da OpenAI, evitando exposição no código cliente.

1. **Para deploy em produção (Vercel):**
   - Configure a variável de ambiente `OPENAI_API_KEY` no painel do Vercel
   - A chave é acessada de forma segura via endpoint serverless
   - Nunca é exposta no código cliente

2. **Para desenvolvimento local:**
```bash
# Crie um arquivo .env na raiz do projeto:
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
   - Configure a variável de ambiente `OPENAI_API_KEY` no arquivo `.env`
   - O sistema usa endpoint serverless seguro para acessar a chave

4. **Execute em desenvolvimento:**
```bash
npm run dev
```

5. **Acesse a aplicação:**
   - Abra http://localhost:3000
   - Faça login com: `sindicante@gocg.com` / `Sind123456`

## 🎤 Sistema de Transcrição

### Como Funciona

O sistema utiliza um fluxo de duas etapas para transcrição inteligente:

1. **Whisper (OpenAI)**: Converte áudio em texto bruto
2. **GPT-4 (OpenAI)**: Formata e corrige o texto para padrão jurídico militar

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
│   │   ├── transcription.js   # Serviço OpenAI Whisper + GPT-4
│   │   ├── config.js          # Configuração API keys
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

### Nova Arquitetura Segura (v2.1.0)

O sistema implementa uma **arquitetura de segurança aprimorada**:

1. **Endpoint Serverless**: `/api/get-openai-key.js`
   - Roda no servidor Vercel (não no cliente)
   - Acessa `process.env.OPENAI_API_KEY` de forma segura
   - Nunca expõe a chave no código cliente

2. **Cliente Seguro**: `transcription.js`
   - Faz requisições POST para `/api/get-openai-key`
   - Recebe a chave temporariamente apenas para uso
   - Não armazena a chave no localStorage ou código

### Desenvolvimento Local
- Use arquivo `.env` na raiz do projeto
- Nunca commite o arquivo `.env`
- Endpoint serverless funciona localmente com `vercel dev`

### Produção (Vercel)
- Configure `OPENAI_API_KEY` nas variáveis de ambiente do Vercel
- Endpoint `/api/get-openai-key` acessa a variável de forma segura
- Chave nunca aparece em logs ou código cliente

### Importante
✅ **SEGURO**: Chaves são acessadas via endpoint serverless
⚠️ **NUNCA** exponha chaves API no código cliente ou repositórios públicos!

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
- **Sem servidor backend**: Apenas arquivos estáticos HTML/CSS/JS
- **APIs externas**: OpenAI (Whisper + GPT-4) e Firebase
- **Zero configuração**: Vercel serve a pasta `public/` automaticamente
- **HTTPS automático**: Necessário para acesso ao microfone
- **Global CDN**: Distribuição mundial automática

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
   - Verifique se a chave OpenAI está configurada
   - Confirme permissões do microfone no navegador

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

### v2.1.0 (Atual) - Refatoração de Segurança
- ✅ **Correção definitiva do erro 400 Whisper API**
- ✅ Remoção da conversão WAV (causa do problema)
- ✅ Uso nativo do formato WebM do navegador
- ✅ **Arquitetura de segurança aprimorada**
- ✅ Endpoint serverless seguro `/api/get-openai-key`
- ✅ Remoção de chaves hardcoded do código cliente
- ✅ Logs detalhados para debugging da API
- ✅ Nome de arquivo correto com extensão (.webm)

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