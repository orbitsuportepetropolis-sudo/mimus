# Manual do Ecossistema de Agentes de IA PaperClip (Nativo)

Este diretório contém a infraestrutura e a lógica de orquestração local e de produção para o **PaperClip**, um ecossistema de 5 agentes de IA operacionais integrados de forma nativa ao Monorepo **Mimus**.

O fluxo e a orquestração dos agentes são executados diretamente no backend da aplicação em JavaScript/TypeScript, consumindo de forma otimizada a API do DeepSeek (V3 e R1) e comunicando-se com a **Evolution API** para interações via WhatsApp.

---

## 1. Estrutura de Diretórios

```
mimus/
├── infra/
│   ├── docker-compose.yml        # Gateway de WhatsApp (Evolution API) enxuto
│   ├── README.md                 # Este manual técnico
│   └── agents/
│       ├── sdrAgent.js           # Agente 1: SDR (Manu) - Vendas, Instagram e Leads MEI
│       ├── cfoAgent.js           # Agente 2: CFO - Diagnósticos financeiros tabulares
│       ├── csAgent.js            # Agente 3: CS (Gabi) - Mentoria e reativação de inativas
│       ├── supportAgent.js       # Agente 4: Suporte N1 - FAQ e escalonamento para Adriano
│       ├── devAgent.js           # Agente 5: DevOps - Triagem profunda de bugs (DeepSeek R1)
│       └── example_integration.js# "Sistema Nervoso" - Exemplos reais de gatilhos no backend
├── mobile/                       # Aplicativo móvel React Native / Expo
└── web/                          # Aplicativo Web / Painel Next.js
```

---

## 2. Inicialização da Infraestrutura Local e VPS (Linux/Ubuntu)

A infraestrutura conta apenas com a **Evolution API** rodando no Docker com volumes persistentes. O banco de dados para sessões e QR Codes é embutido (SQLite local no volume), tornando a stack leve e robusta.

### Passo 2.1: Instalar o Docker (Caso não possua)
No Ubuntu:
```bash
sudo apt update && sudo apt install docker.io docker-compose-v2 -y
sudo systemctl enable --now docker
```

### Passo 2.2: Iniciar o Serviço
Navegue até a pasta `infra/` e execute:
```bash
cd mimus/infra
docker compose up -d
```
- A Evolution API estará ouvindo na porta local `8080` (URL: `http://localhost:8080`).
- Todas as sessões e QR Codes gerados estarão persistidos no volume Docker `evolution_instances`.

---

## 3. Configurando Variáveis de Ambiente (.env)

No servidor ou ambiente local de execução da sua aplicação backend, garanta a configuração das seguintes variáveis no arquivo `.env` para que os agentes de IA operem de forma correta:

```env
# Chave de API da plataforma DeepSeek (Utilizada por todos os agentes)
DEEPSEEK_API_KEY=sua_chave_deepseek_aqui

# Configurações da Evolution API (Gateway de WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=generate_a_secure_api_key_here

# Webhook do Discord para Alertas do DevOps AI
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/seu_webhook_id/token
```

---

## 4. Funcionamento Técnico dos Agentes

Cada agente em `infra/agents/` exporta uma função principal assíncrona que monta a chamada HTTP utilizando o `fetch` padrão para a API oficial do DeepSeek (`https://api.deepseek.com/v1`).

### 1. SDR / Inside Sales (`sdrAgent.js`)
- **Model:** `deepseek-chat`
- **Frente WhatsApp/Instagram:** Qualifica leads, responde a dúvidas do produto de forma empática e amigável (tom de pré-vendas da "Manu"), tentando trazer clientes para a demonstração.
- **Frente Novos MEIs:** Filtra e tria empresas MEIs abertas contendo os CNAEs específicos de beleza (Cosméticos, Estética, Salões, etc.). Se aprovados, elabora abordagens personalizadas oferecendo os 7 dias grátis de trial.

### 2. CFO Virtual (`cfoAgent.js`)
- **Model:** `deepseek-chat`
- **Lógica:** Consome JSON estruturado de dados SaaS (MRR, Churn, CAC, LTV, Burn Rate), gerando diagnósticos tabulares em Markdown com emojis de alerta visual (🟢, 🟡, 🔴) e um resumo executivo direto e frio.

### 3. Customer Success (`csAgent.js`)
- **Model:** `deepseek-chat`
- **Lógica:** Elaborado para lojistas com inatividade superior a 5 dias. Traz o tom mentor e empático da "Gabi", sugerindo dicas práticas de marketing e administração para fazê-las reabrir e usar o aplicativo.

### 4. Suporte Nível 1 (`supportAgent.js`)
- **Model:** `deepseek-chat`
- **Lógica:** Injeta a FAQ do sistema no contexto para sanar dúvidas didáticas comuns da lojista.
- **Segurança e Escalonamento:** Se o texto do cliente envolver problemas financeiros (cobrança, mensalidade, PIX) ou falhas severas do sistema, intercepta e responde de forma padronizada que um chamado de prioridade máxima foi aberto diretamente para o desenvolvedor-chefe (Adriano).

### 5. DevOps / Depuração de Bugs (`devAgent.js`)
- **Model:** `deepseek-reasoner` (DeepSeek-R1)
- **Lógica:** Triagem profunda de logs de erro e stack traces. O modelo realiza o raciocínio lógico em cadeia da causa raiz e propõe patches cirúrgicos no formato Git Diff, pronto para ser encaminhado no canal privado de controle de bugs do Discord.

---

## 5. Como Integrar os Agentes ao Backend

Consulte o arquivo [infra/agents/example_integration.js](file:///c:/Users/letic/Documents/PROJETOS/mimus/infra/agents/example_integration.js) para ver códigos de exemplo executáveis sobre como escutar webhooks, acionar os disparos automáticos e capturar erros HTTP 500 do backend da sua aplicação para repassar ao `devAgent.js` em background.
