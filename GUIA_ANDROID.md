# Guia de Configuração Android (Via Capacitor)

Este guia explica como transformar seu projeto Next.js em um aplicativo Android.

## Pré-requisitos
1. **Android Studio** instalado e configurado no seu computador.
2. PC e Celular na mesma rede Wi-Fi (para testes locais).

## Passo 1: Instalar dependências
No terminal do VS Code, execute:
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
```

## Passo 2: Inicializar o Capacitor
O arquivo de configuração `capacitor.config.ts` já foi criado na raiz do projeto.
Agora execute:
```bash
npx cap add android
```
Isso criará uma pasta `android/` no seu projeto.

## Passo 3: Configurar a Conexão
Como seu projeto usa "Server Actions" (Node.js/DynamoDB), o app Android precisa se conectar a um servidor rodando. Ele **não** funcionará se você apenas copiar os arquivos HTML estáticos.

### Para testar (Desenvolvimento):
1. Descubra o IP do seu computador (no terminal digite `ipconfig` no Windows).
2. Abra o arquivo `capacitor.config.ts`.
3. Descomente e edite a linha `url` com seu IP:
   ```typescript
   url: 'http://192.168.X.X:3000',
   cleartext: true,
   ```
4. Inicie seu servidor Next.js: `npm run dev`.

### Para publicar (Produção):
Quando você publicar seu site (na Vercel, AWS, etc.), atualize o `capacitor.config.ts` com a URL final:
```typescript
url: 'https://meu-shopping-intranet.com',
```

## Passo 4: Sincronizar e Rodar
Sempre que mudar a configuração do capacitor, execute:
```bash
npx cap sync
```

Para abrir o projeto no Android Studio e rodar no emulador ou celular:
```bash
npx cap open android
```
Dentro do Android Studio, clique no botão "Play" (triângulo verde).

---

## ⚠️ Nota de Segurança Importante
Seu arquivo `next.config.ts` expõe chaves da AWS (`APP_AWS_SECRET_ACCESS_KEY`) para o ambiente. 
Ao criar um aplicativo Android, esse código fica dentro do celular do usuário.
**Recomendação:** Para produção, certifique-se de que essas chaves de ambiente sejam usadas **apenas** no servidor (Server Actions) e não prefixadas com `NEXT_PUBLIC_` ou expostas via `env` no `next.config.js`, a menos que estritamente necessário.
