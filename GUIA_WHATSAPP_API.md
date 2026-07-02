# Integração Oficial WhatsApp (Próximos Passos)

Para que o componente `WhatsAppEmbed` funcione de verdade, enviando e recebendo mensagens reais, você precisa de um provedor de API, pois **não é possível** embarcar o "web.whatsapp.com" oficial em um iframe por motivos de segurança do Facebook/Meta.

## Opção 1: Gupshup / Twilio (API Oficial)
Esta é a forma mais profissional e estável.

1.  Crie uma conta na Twilio ou Gupshup.
2.  Obtenha o `ACCOUNT_SID` e `AUTH_TOKEN`.
3.  Configure o Webhook para receber mensagens.
4.  No arquivo `components/WhatsAppEmbed.tsx`, substitua o `MOCK_CHATS` por uma chamada à API dessas plataformas.

## Opção 2: Z-API / WPPConnect (APIs Não-Oficiais)
São serviços que "Lêem" o QR Code de um WhatsApp normal existente.

1.  Contrate um serviço como Z-API.
2.  Eles fornecem uma URL que você chama para enviar mensagens.
3.  Use `socket.io` para receber mensagens em tempo real.

O componente visual (Chat UI) já está criado e pronto no arquivo `components/WhatsAppEmbed.tsx`. Você só precisa conectar o "backend" dele à API escolhida.
