const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs   = require('fs')

app.setName('StudioFlow')

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

  const win = new BrowserWindow({
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
      additionalArguments: ['--data-dir=' + global.DATA_DIR]
    }
  })

  win.loadFile('index.html')
  win.on('page-title-updated', (e) => e.preventDefault())
}

function getDataDir() {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'data')
  }
  return path.join(__dirname, 'data')
}

require('./js/ghz-backend')({
  app, ipcMain, getDataDir,
  appId: 'studioflow',
  manifestUrl: 'https://raw.githubusercontent.com/GhuzzBeatz/studioflow/master/update-manifest.json'
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
