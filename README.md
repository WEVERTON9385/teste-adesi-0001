# CRS Vision Manager - Versão Desktop

Este projeto é um sistema de controle de produção moderno, configurado para ser compilado como um aplicativo Windows (.exe) nativo usando Electron.

## 🚀 Como Gerar o Instalador (.exe)

Para criar o arquivo de instalação final que será usado nos computadores da empresa, siga estes passos no terminal do seu editor de código:

### 1. Instalar as Ferramentas (Faça uma única vez)
```bash
npm install
```

### 2. Criar o Executável
Este comando irá compilar todo o código, otimizar para produção e gerar o instalador Windows.
```bash
npm run dist
```
*Aguarde o processo finalizar. Pode levar alguns minutos.*

---

## 📂 Onde está o arquivo?

Após o processo terminar com sucesso, o instalador estará na pasta:

`dist-electron/CRS Vision Manager Setup 2.0.0.exe`

Copie este arquivo para um Pen Drive ou Rede e instale nos computadores desejados.

---

## Requisitos de Desenvolvimento
- Node.js instalado (versão 18 ou superior recomendada).
- Ícone do aplicativo deve estar em `public/icon.ico` (opcional, mas recomendado para o build final).

## Recursos
- **Banco de Dados**: Local (IndexedDB) - Funciona offline.
- **Tema**: Claro/Escuro persistente.
- **Backup**: Sistema integrado de backup e restauração JSON.