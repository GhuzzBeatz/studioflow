# Como gerar o instalador (.exe) do StudioFlow

## Pré-requisitos
- Node.js instalado (https://nodejs.org) — versão 18 ou superior
- Windows 10 ou 11

## Passos

1. Extraia a pasta studioflow no seu PC

2. Abra o terminal (Prompt de Comando ou PowerShell) dentro da pasta studioflow

3. Instale as dependências:
   npm install

4. Teste o app antes de gerar o instalador:
   npm start

5. Gere o instalador Windows:
   npm run build

6. O instalador será gerado em:
   studioflow/dist_installer/StudioFlow Setup 1.0.0.exe

7. Distribua esse arquivo .exe para os clientes.
   Ao instalar, o app cria atalho na área de trabalho e no menu iniciar.

## Observações
- Os dados ficam salvos em: C:\Users\[usuario]\AppData\Roaming\studioflow\data\
- Ao desinstalar, os dados NÃO são apagados (configurado assim de propósito)
- Para converter logo.png em logo.ico (melhor qualidade no Windows):
  Use o site https://convertio.co/png-ico/ e substitua o arquivo logo.png por logo.ico
  Depois no package.json mude "icon": "logo.png" para "icon": "logo.ico"
