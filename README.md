# 🌱 BioVencido

> Tecnologia e consciência contra o desperdício de alimentos.

O **BioVencido** é uma aplicação web que ajuda usuários a controlar as datas de validade dos seus produtos alimentícios, sugerindo receitas com o que está prestes a vencer e indicando pontos de doação e descarte adequado.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Como Rodar](#como-rodar)
- [Banco de Dados](#banco-de-dados)
- [Rotas da API](#rotas-da-api)
- [Equipe](#equipe)

---

## 📖 Sobre o Projeto

O BioVencido foi desenvolvido como projeto acadêmico nas disciplinas de **PI: Projeto e Implementação de Aplicativos** e **Sistema de Banco de Dados** da PUC-Campinas.

O projeto ataca diretamente dois ODS (Objetivos de Desenvolvimento Sustentável):
- **ODS 12** – Consumo e Produção Responsáveis: redução do desperdício de alimentos
- **ODS 2** – Fome Zero: incentivo à doação de itens próximos ao vencimento

---

## ✅ Funcionalidades

- **Despensa Virtual** – cadastro de produtos com nome, categoria, quantidade e data de validade
- **Controle de Validade** – semáforo visual (verde, amarelo, vermelho) conforme proximidade do vencimento
- **Sugestão de Receitas** – mais de 230 receitas filtradas pelos ingredientes que estão vencendo e pelas alergias/dieta do usuário
- **Pontos de Doação** – 30 locais de doação em Campinas e São Paulo com endereço e horário
- **Pontos de Descarte** – 30 ecopontos em Campinas e São Paulo com instruções de descarte
- **Perfil de Usuário** – cadastro de alergias, dietas e preferências de notificação
- **Sistema de Login** – cadastro e autenticação de usuários

---

## 🛠️ Tecnologias

### Front-End
- HTML5
- CSS3 (variáveis, Flexbox, Grid)
- JavaScript (Vanilla)

### Back-End
- Node.js
- Express.js
- Prisma ORM

### Banco de Dados
- MySQL

### Ferramentas
- Nodemon (desenvolvimento)
- VS Code
- GitHub
- MySQL Workbench

---

## 📁 Estrutura do Projeto

```
BioVencido/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── itensController.js       # Lógica dos itens perecíveis
│   │   │   ├── outrosController.js      # Lógica de locais de despejo e doação
│   │   │   ├── receitasController.js    # Lógica das receitas com filtros
│   │   │   └── usuarioController.js     # Lógica de autenticação e perfil
│   │   ├── routes/
│   │   │   ├── itens.js
│   │   │   ├── receitas.js
│   │   │   ├── locaisdespejo.js
│   │   │   ├── locaisdoacao.js
│   │   │   ├── doacoes.js
│   │   │   ├── endereco.js
│   │   │   ├── usuario.js
│   │   │   └── ia.js
│   │   └── server.js                    # Servidor Express principal
│   ├── prisma/                          # Schema do banco de dados
│   ├── .env.example                     # Exemplo de variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── script.js                    # Lógica principal do front-end
│   │   └── auth.js                      # Autenticação no front-end
│   ├── pages/
│   │   ├── login.html
│   │   └── cadastro.html
│   └── index.html                       # Tela principal (SPA)
└── bioVencido.sql                       # Dump completo do banco de dados
```

---

## ⚙️ Pré-requisitos

Antes de rodar o projeto, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [MySQL](https://www.mysql.com/) (versão 8 ou superior)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) com a extensão **Live Server** instalada

---

## 🚀 Como Rodar

### 1. Clone o repositório

```bash
git clone https://github.com/EnzoYasuda/BioVencido.git
cd BioVencido
```

---

### 2. Configure o Banco de Dados

Abra o **MySQL Workbench**, conecte ao servidor local e execute:

```sql
CREATE DATABASE BioVencido;
```

Depois, importe o dump pelo terminal (fora do VS Code, no Prompt de Comando do Windows):

```bash
mysql -u root -p BioVencido < bioVencido.sql
```

> ⚠️ Quando pedir senha, digite a senha do seu MySQL e pressione Enter. O cursor não vai aparecer — isso é normal.

Isso irá criar todas as tabelas e popular o banco com:
- 233 receitas categorizadas
- 30 locais de doação
- 30 ecopontos de descarte
- 62 endereços cadastrados

---

### 3. Configure as variáveis de ambiente

Dentro da pasta `backend/`, crie um arquivo chamado **`.env`** (sem nenhuma extensão).

> **Windows:** Abra o VS Code, navegue até a pasta `backend/` e crie um novo arquivo chamado `.env`

Cole o seguinte conteúdo e substitua com seus dados:

```env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/BioVencido"
GROQ_API_KEY=sua_chave_aqui
```

**Onde obter cada valor:**

- `SUA_SENHA` → a senha que você usa para entrar no MySQL Workbench
- `GROQ_API_KEY` → chave gratuita obtida em [console.groq.com](https://console.groq.com) (criar conta → API Keys → Create API Key)

> 📧 Se preferir não criar a conta Groq, entre em contato com a equipe para receber uma chave de teste.

---

### 4. Instale as dependências do Back-End

Abra o terminal do VS Code dentro da pasta `backend/` e execute:

```bash
npm install
```

---

### 5. Gere o cliente Prisma

Ainda dentro da pasta `backend/`, execute:

```bash
npx prisma generate
```

> Esse comando é necessário para o Prisma conseguir se comunicar com o banco de dados.

---

### 6. Inicie o servidor

```bash
npm run dev
```

Aguarde aparecer a mensagem:
```
Servidor rodando na porta 3000
```

> Deixe esse terminal aberto enquanto usa o site. Se fechar, o site para de funcionar.

---

### 7. Abra o Front-End

No VS Code, clique com o **botão direito** no arquivo `frontend/index.html` e selecione **"Open with Live Server"**.

O site abrirá automaticamente no navegador em:
```
http://127.0.0.1:5500
```

> ⚠️ **Importante:** Não abra o arquivo diretamente pelo navegador (file:///). Isso bloqueia a comunicação com o servidor e o site não vai funcionar corretamente.

---

### ✅ Checklist Final

Antes de usar o site, confirme:

- [ ] MySQL está rodando
- [ ] Banco `BioVencido` foi criado e populado com o dump
- [ ] Arquivo `.env` está criado na pasta `backend/` com senha e chave corretas
- [ ] Terminal com `npm run dev` está aberto e mostra "Servidor rodando na porta 3000"
- [ ] Site aberto pelo Live Server (URL começa com `http://127.0.0.1:5500`)

---

## 🗄️ Banco de Dados

O banco de dados é composto pelas seguintes tabelas principais:

| Tabela | Descrição |
|--------|-----------|
| `usuario` | Dados de login, alergias, dietas e preferências |
| `itenspereciveis` | Produtos da despensa com datas e status |
| `receitas` | Receitas com ingredientes, alergênios e categorias |
| `localdoacao` | Pontos de doação de alimentos |
| `localdespejo` | Ecopontos para descarte adequado |
| `endereco` | Endereços vinculados a usuários e locais |
| `doacao` | Registro de doações realizadas |

---

## 🔌 Rotas da API

O servidor roda na porta `3000`. Principais endpoints:

### Usuário
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/usuario/register` | Cadastro de novo usuário |
| POST | `/usuario/login` | Login |
| GET | `/usuario/:id` | Dados do perfil |
| PATCH | `/usuario/:id` | Atualizar perfil |

### Itens Perecíveis
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/itens` | Lista itens do usuário logado |
| POST | `/itens` | Adicionar novo item |
| PATCH | `/itens/:id` | Atualizar item |
| DELETE | `/itens/:id` | Remover item |

### Receitas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/receitas` | Lista receitas filtradas por categoria, alergias e dieta |
| GET | `/receitas/:id` | Detalhes de uma receita |

### Locais
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/despejo` | Lista ecopontos de descarte |
| GET | `/doacao` | Lista locais de doação |

---

## 👥 Equipe

Grupo **BioVencido** — PUC-Campinas, 2026

| Nome | RA |
|------|-----|
| Enzo Eiki Yasuda | 24000880 |
| Gustavo Bordin Corrêa | 24002887 |
| Felipe Martins Leivas | 24001643 |
| Maria Elisa Guimarães de Faria | 24002214 |
| Maria Eduarda Trevisan | 24000309 |
| Sarah Mendes Ferraz | 24002927 |

---

*Projeto desenvolvido para as disciplinas de PI e Sistema de Banco de Dados — PUC-Campinas*
