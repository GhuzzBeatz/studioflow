// Utilitário compartilhado - caminho dos dados
const path = require('path')
const fs   = require('fs')

// Tenta múltiplos caminhos para garantir compatibilidade
function getDataPath(arquivo) {
  const candidatos = [
    path.join(process.cwd(), 'data', arquivo),
    path.join(__dirname, '..', 'data', arquivo),
    path.join(path.dirname(process.execPath), 'data', arquivo)
  ]
  for (const c of candidatos) {
    try {
      const dir = path.dirname(c)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      if (!fs.existsSync(c)) fs.writeFileSync(c, '[]')
      // Testa escrita
      fs.accessSync(dir, fs.constants.W_OK)
      return c
    } catch(e) { continue }
  }
  return candidatos[0]
}

function lerJSON(arquivo) {
  const p = getDataPath(arquivo)
  try {
    const raw = fs.readFileSync(p, 'utf8').trim()
    return JSON.parse(raw || '[]')
  } catch(e) { return [] }
}

function salvarJSON(arquivo, dados) {
  const p = getDataPath(arquivo)
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), 'utf8')
}

function fmtMoeda(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtData(d) {
  if (!d) return '—'
  const p = d.split('-')
  return p[2] + '/' + p[1] + '/' + p[0]
}
