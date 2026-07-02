import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shopping.intranet',
  appName: 'Shopping Intranet',
  webDir: 'mobile-app',
  server: {
    // ---------------------------------------------------------------------------
    // CONFIGURAÇÃO DE PRODUÇÃO (AWS AMPLIFY)
    // O app agora aponta para o servidor oficial na nuvem.
    // ---------------------------------------------------------------------------
    url: 'https://main.d2d6lkome86oog.amplifyapp.com',
    
    // androidScheme: 'https'
  }
};

export default config;
