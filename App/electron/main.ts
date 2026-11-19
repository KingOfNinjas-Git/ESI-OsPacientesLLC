// FICHEIRO: electron/main.ts
// GameHaven Desktop — o Electron abre o site dentro de uma janela de aplicação (a mesma interface, tipo o Discord).
//
// O endereço do site vem da variável GAMEHAVEN_URL. Se não existir, usa:
//  - em desenvolvimento: http://localhost:3000
//  - na app já empacotada: o site alojado na Hostinger (muda o PRODUCTION_URL)
import { app, BrowserWindow, shell, Menu } from "electron";
import path from "node:path";
import { readFileSync } from "node:fs";

const PRODUCTION_URL = "https://gamehaven.pt"; // TODO: substituir pelo domínio da Hostinger
// Escolhe o endereço: primeiro a variável de ambiente; senão, produção (se empacotada) ou localhost (em desenvolvimento).
const SITE_URL = process.env.GAMEHAVEN_URL ?? (app.isPackaged ? PRODUCTION_URL : "http://localhost:3000");
const BRAND_BG = "#18063a"; // o roxo escuro da marca, usado como fundo

// Onde está o logótipo (usado como ícone da janela e no ecrã de carregamento).
const iconPath = path.join(__dirname, "..", "assets", "logo.png");

// Cria a página HTML (escrita aqui mesmo, sem ficheiro) do ecrã de carregamento mostrado enquanto o site abre.
function splashHtml() {
  // Ecrã de carregamento (Figma "Loading Screen").
  // Convertemos o logótipo em texto (base64) para o poder meter dentro do HTML.
  const logo = `data:image/png;base64,${readFileSync(iconPath).toString("base64")}`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><body style="margin:0;height:100vh;display:grid;place-items:center;background:${BRAND_BG};-webkit-app-region:drag">
<img src="${logo}" width="188" height="188" style="animation:p 1.6s ease-in-out infinite"/>
<style>@keyframes p{50%{opacity:.55}}</style></body></html>`)}`;
}

// Cria a página mostrada quando o site não responde (sem internet ou servidor desligado), com um botão para tentar outra vez.
function offlineHtml() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><body style="margin:0;height:100vh;display:grid;place-items:center;background:${BRAND_BG};color:#fff;font-family:system-ui;text-align:center">
<div><h1 style="font-weight:500">Sem ligação ao GameHaven</h1><p style="opacity:.75">Não foi possível abrir ${SITE_URL}.</p>
<button onclick="location.href='${SITE_URL}'" style="margin-top:12px;padding:10px 18px;border:0;border-radius:6px;background:#fff;color:${BRAND_BG};font-weight:600;cursor:pointer">Tentar novamente</button></div></body></html>`)}`;
}

// Cria as duas janelas: a de carregamento (pequena) e a principal (com o site).
// A principal só aparece quando o site acabou de carregar ("ready-to-show"), e nessa altura a de carregamento fecha.
function createWindow() {
  // A janelinha de carregamento: sem moldura, tamanho fixo.
  const splash = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    resizable: false,
    backgroundColor: BRAND_BG,
    show: true,
  });
  splash.loadURL(splashHtml());

  // A janela principal. Começa escondida (show: false) até o site estar pronto.
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 600,
    show: false,
    title: "GameHaven",
    icon: iconPath,
    backgroundColor: BRAND_BG,
    autoHideMenuBar: true,
    // Definições de segurança: o site não tem acesso ao Node.js nem ao sistema do computador.
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Ligações externas (redes sociais, etc.) abrem no browser do sistema, e não dentro da app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(SITE_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  // O mesmo para quando se clica numa ligação que sairia do nosso site.
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(SITE_URL) && !url.startsWith("data:")) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  // Se o site não carregar, mostra a página "Sem ligação" com botão para tentar de novo.
  win.webContents.on("did-fail-load", (_e, code, _desc, url) => {
    if (code === -3 || url.startsWith("data:")) return; // -3 = navegação abortada (não é um erro a sério)
    win.loadURL(offlineHtml());
  });

  // Quando o site está pronto, espera 0,6 s (para o carregamento não desaparecer de repente),
  // fecha a janelinha de carregamento e mostra a janela principal.
  win.once("ready-to-show", () => {
    setTimeout(() => {
      splash.destroy();
      win.show();
    }, 600);
  });

  // Manda a janela principal abrir o site.
  win.loadURL(SITE_URL);
}

// Define o nome da aplicação.
app.setName("GameHaven");

// Arranque da app. No macOS cria um menu mínimo em português e põe o ícone na Dock.
app.whenReady().then(() => {
  if (process.platform === "darwin") {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: "appMenu" },
        { role: "editMenu" },
        { label: "Ver", submenu: [{ role: "reload", label: "Recarregar" }, { role: "togglefullscreen" }, { role: "toggleDevTools" }] },
        { role: "windowMenu" },
      ]),
    );
    app.dock?.setIcon(iconPath);
  }
  createWindow();
  // No macOS, clicar no ícone da Dock sem janelas abertas cria uma janela nova.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Fechar todas as janelas termina a app (exceto no macOS, onde é normal a app continuar na Dock).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
