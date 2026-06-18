// Resolve o caminho correto dos dados tanto em dev quanto instalado
const path    = require('path')
const { remote, app } = require('electron')

function getDataDir() {
  try {
    // Tenta pegar o argumento passado pelo main.js
    const arg = process.argv.find(a => a.startsWith('--data-dir='))
    if (arg) return arg.replace('--data-dir=', '')
  } catch(e) {}
  // Fallback: pasta local data/
  return path.join(__dirname, '..', 'data')
}

const DATA_DIR = getDataDir()
