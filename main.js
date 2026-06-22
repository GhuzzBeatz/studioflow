const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs   = require('fs')

app.setName('StudioFlow')

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) app.quit()

let win = null
let ghzBackend = null

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
})

function isLicensePageUrl(url) {
  try { return decodeURIComponent(new URL(url).pathname).replace(/\\/g, '/').endsWith('/pages/licenca.html') } catch (e) { return false }
}

function loadLicensePage() {
  if (win && !win.isDestroyed()) win.loadFile('pages/licenca.html').catch(() => {})
}

// Garante pasta de dados mesmo após instalação
function garantirDados() {
  // Em produção (instalado), usa pasta de dados do usuário
  // Em dev, usa pasta local data/
  let dataDir
  if (app.isPackaged) {
    dataDir = path.join(app.getPath('userData'), 'data')
  } else {
    dataDir = path.join(__dirname, 'data')
  }
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const arquivos = ['agenda.json','clientes.json','servicos.json','financeiro.json']
  arquivos.forEach(arq => {
    const p = path.join(dataDir, arq)
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf8')
  })
  // Disponibiliza o caminho globalmente para os scripts
  global.DATA_DIR = dataDir
}

function createWindow() {
  garantirDados()

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'StudioFlow',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      contextIsolation: false,
      webSecurity: false,
      devTools: !app.isPackaged,
      additionalArguments: ['--data-dir=' + global.DATA_DIR]
    }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (!ghzBackend?.isSessionAuthorized() && !isLicensePageUrl(url)) {
      event.preventDefault()
      loadLicensePage()
    }
  })
  win.on('page-title-updated', (e) => e.preventDefault())
}

function getDataDir() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'data')
  }
  return path.join(__dirname, 'data')
}

ghzBackend = require('./js/ghz-backend')({
  app, ipcMain, getDataDir,
  appId: 'studioflow',
  manifestUrl: 'https://raw.githubusercontent.com/GhuzzBeatz/studioflow/master/update-manifest.json'
})

app.whenReady().then(async () => {
  if (!gotSingleInstanceLock) return
  createWindow()
  await win.loadFile('pages/licenca.html')
  const result = await ghzBackend.validateForStartup().catch(() => ({ ok: false }))
  if (result?.ok && win && !win.isDestroyed()) await win.loadFile('index.html')
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
