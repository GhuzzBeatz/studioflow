const fs   = require('fs')
const path = require('path')
function getDataDir() {
  try {
    const arg = process.argv.find(a => a.startsWith('--data-dir='))
    if (arg) return arg.replace('--data-dir=', '')
  } catch(e) {}
  return require('path').join(__dirname, '..', 'data')
}
const DATA_DIR = getDataDir()


function ler(arq) {
  const p = path.join(DATA_DIR, arq)
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf8')
    return JSON.parse(fs.readFileSync(p, 'utf8').trim() || '[]')
  } catch(e) { return [] }
}

function fmtMoeda(v) { return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) }
function fmtData(d)  { if(!d)return'—'; const p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0] }

function jaPassou(data, hora) {
  return new Date(data + 'T' + (hora||'23:59') + ':00') < new Date()
}

function carregarDashboard() {
  const agenda   = ler('agenda.json')
  const clientes = ler('clientes.json')

  const atendidos = agenda.filter(a => jaPassou(a.data, a.hora))
  const pendentes = agenda.filter(a => !jaPassou(a.data, a.hora))

  document.getElementById('totalAtendidos').textContent = atendidos.length
  document.getElementById('totalPendentes').textContent = pendentes.length
  document.getElementById('totalClientes').textContent  = clientes.length

  const fatReal = atendidos.reduce((s,a) => s + Number(a.valor||0), 0)
  document.getElementById('faturamento').textContent = fmtMoeda(fatReal)

  // Próximos (futuros, ordenados crescente)
  const proximos = [...pendentes].sort((a,b) => {
    return new Date(a.data+'T'+(a.hora||'00:00')) - new Date(b.data+'T'+(b.hora||'00:00'))
  }).slice(0, 8)

  const tbProx = document.getElementById('tabelaProximos')
  tbProx.innerHTML = proximos.length ? proximos.map(a => `
    <tr>
      <td>${fmtData(a.data)}</td><td>${a.hora||'—'}</td>
      <td><b style="color:#F2F2F2">${a.cliente}</b></td>
      <td><span class="badge badge-pendente">${a.servico}</span></td>
      <td style="text-align:right;color:#4a90d9;font-weight:700">${fmtMoeda(a.valor)}</td>
    </tr>`).join('')
  : '<tr><td colspan="5" class="empty">Nenhum agendamento futuro.</td></tr>'

  // Últimos atendidos (mais recentes primeiro)
  const ultAtend = [...atendidos].sort((a,b) => {
    return new Date(b.data+'T'+(b.hora||'00:00')) - new Date(a.data+'T'+(a.hora||'00:00'))
  }).slice(0, 8)

  const tbAtend = document.getElementById('tabelaAtendimentos')
  tbAtend.innerHTML = ultAtend.length ? ultAtend.map(a => `
    <tr>
      <td>${fmtData(a.data)}</td><td>${a.hora||'—'}</td>
      <td><b style="color:#F2F2F2">${a.cliente}</b></td>
      <td><span class="badge badge-atendido">${a.servico}</span></td>
      <td style="text-align:right;color:#00c878;font-weight:700">${fmtMoeda(a.valor)}</td>
    </tr>`).join('')
  : '<tr><td colspan="5" class="empty">Nenhum atendimento realizado ainda.</td></tr>'
}

carregarDashboard()
