# CRS Vision Manager - Versão Desktop

Este projeto está configurado para ser compilado como um aplicativo Windows (.exe) usando Electron.

## Como Gerar o Instalador (.exe)

Siga os passos abaixo no terminal do seu computador (VS Code, CMD ou PowerShell):

### 1. Instalar Dependências
Primeiro, baixe as bibliotecas necessárias.
```bash
npm install
```

### 2. Testar o App (Opcional)
Para rodar o app em modo de desenvolvimento (janela desktop + hot reload).
```bash
npm run electron:dev
```

### 3. Criar o Executável
Este comando irá compilar o código React e empacotá-lo em um instalador Windows.
```bash
npm run dist
```

---

## Onde está o arquivo?
Após o processo terminar (pode levar 1 ou 2 minutos), o instalador estará na pasta:

`dist-electron/CRS Vision Manager Setup 2.0.0.exe`

Basta copiar este arquivo para os computadores da empresa e instalar.

---

## Requisitos
- Node.js instalado (versão 16 ou superior).
