# Shopping Intranet - Sistema de Gestão de Shopping Centers (Versão Local/Servidor Comum)

Esta é a versão portável do **Shopping Intranet**, reestruturada para rodar em servidores convencionais (on-premise ou VPS) e infraestruturas locais sem qualquer dependência da AWS. 

O banco de dados original (DynamoDB) foi migrado para **PostgreSQL** (com ORM Prisma) e o armazenamento de imagens (S3) foi migrado para gravação no sistema de arquivos local. O **Redis** foi integrado para cache de consultas de leitura e escalabilidade de sessões.

---

## 🛠️ Arquitetura e Componentes

A infraestrutura consiste de:
1.  **Next.js 14 Web Application**: Interface administrativa servida por Node.js.
2.  **PostgreSQL**: Banco de dados relacional que gerencia toda a persistência de lojistas, empreendimentos, tarefas, calendários e logs.
3.  **Redis**: Utilizado para cachear listagens de dados e otimizar a velocidade de resposta do servidor, além de suportar filas de tarefas se necessário.
4.  **Local Storage (Uploads)**: Imagens de plantas baixas e capas são salvas no diretório `/public/uploads/` do próprio servidor web.

---

## 💻 Requisitos do Servidor

Para rodar este projeto no seu servidor, certifique-se de ter instalado:
*   [Node.js (versão 18 ou superior)](https://nodejs.org/)
*   [Docker e Docker Compose](https://www.docker.com/)

---

## 🚀 Como Executar em Desenvolvimento/Produção Local

### 1. Iniciar Serviços de Banco de Dados e Cache (Docker)
No diretório raiz do projeto, execute o comando para iniciar o PostgreSQL e o Redis:
```bash
docker compose up -d
```
*Isso criará os containers em background nas portas padrões (`5432` para PostgreSQL e `6379` para Redis) com volumes persistidos localmente.*

### 2. Configurar Variáveis de Ambiente
Verifique as configurações no arquivo `.env` (criado automaticamente a partir de `.env.example` com os acessos padrões do Docker):
*   `DATABASE_URL`: String de conexão com o banco do container PostgreSQL.
*   `REDIS_URL`: URL de conexão do cache Redis.

### 3. Executar as Migrações do Banco de Dados (Prisma)
Para criar a estrutura de tabelas e índices no PostgreSQL, rode o comando:
```bash
npx prisma db push
```

*(Opcional) Se quiser abrir o painel visual do Prisma Studio para ver os dados das tabelas:*
```bash
npx prisma studio
```

### 4. Instalar Dependências e Executar a Aplicação

#### Em Desenvolvimento:
```bash
npm install
npm run dev
```
Acesse: `http://localhost:3000`

#### Em Produção:
```bash
npm run build
npm run start
```

---

## 🛡️ Usuário Administrador Inicial
Se a tabela de usuários estiver vazia no banco, você pode fazer o login inicial usando as credenciais de fallback:
*   **Email**: `admin@shopping.com`
*   **Senha**: `admin`

Ao logar, você poderá acessar o menu de **Corretores/Usuários** para cadastrar novos usuários e definir suas respectivas permissões granularmente.

---

## 📂 Organização dos Arquivos de Dados e Cache
*   **Imagens de Upload**: Ficam salvas em `public/uploads/images/`. Certifique-se de dar permissões de escrita a esta pasta em servidores Linux.
*   **Arquivos do Banco de Dados**: O Docker monta um volume local seguro chamado `postgres_data` para manter as tabelas persistentes no servidor mesmo se o container for parado ou recriado.
