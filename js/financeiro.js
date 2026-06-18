const fs   = require('fs')
const path = require('path')
// Financeiro lê direto da agenda — somente atendimentos cujo horário JÁ PASSOU

function getDataDir() {
  try {
    const arg = process.argv.find(a => a.startsWith('--data-dir='))
    if (arg) return arg.replace('--data-dir=', '')
  } catch(e) {}
  return require('path').join(__dirname, '..', 'data')
}
const DATA_DIR = getDataDir()

const ARQ = require('path').join(DATA_DIR, 'agenda.json')
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function ler() {
  try {
    if (!fs.existsSync(ARQ)) return []
    return JSON.parse(fs.readFileSync(ARQ, 'utf8').trim() || '[]')
  } catch(e) { return [] }
}

function jaPassou(data, hora) {
  return new Date(data + 'T' + (hora||'23:59') + ':00') < new Date()
}

function fmtMoeda(v) { return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) }
function fmtData(d)  { if(!d)return'—'; const p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0] }

function limparFiltro() {
  document.getElementById('filtroMes').value = ''
  renderFinanceiro()
}

function renderFinanceiro() {
  const filtro = document.getElementById('filtroMes').value
  // Somente atendimentos já realizados (horário passou)
  const todos  = ler().filter(a => jaPassou(a.data, a.hora))
  let dados    = filtro ? todos.filter(f => (f.data||'').startsWith(filtro)) : todos
  dados        = [...dados].sort((a,b) =>
    new Date(b.data+'T'+(b.hora||'00:00')) - new Date(a.data+'T'+(a.hora||'00:00'))
  )

  // Card "Total Faturado": se filtro ativo = total do período filtrado; senão = total geral
  const totalCard = dados.reduce((s,f) => s + Number(f.valor||0), 0)
  const labelCard = filtro
    ? (() => { const [ano,mes]=filtro.split('-'); return MESES[Number(mes)-1]+' '+ano })()
    : 'todos os períodos'
  document.getElementById('totalGeral').textContent      = fmtMoeda(totalCard)
  document.getElementById('labelTotalGeral').textContent = labelCard

  // Faturamento mês atual (sempre)
  const hoje   = new Date()
  const anoMes = hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')
  const totMes = todos.filter(f=>(f.data||'').startsWith(anoMes)).reduce((s,f)=>s+Number(f.valor||0),0)
  document.getElementById('totalMes').textContent = fmtMoeda(totMes)
  document.getElementById('nomeMes').textContent  = MESES[hoje.getMonth()]+' '+hoje.getFullYear()

  // Ticket médio
  document.getElementById('ticketMedio').textContent = todos.length
    ? fmtMoeda(todos.reduce((s,f)=>s+Number(f.valor||0),0)/todos.length)
    : fmtMoeda(0)

  const count = document.getElementById('countFin')
  if (count) count.textContent = dados.length+' registro(s) realizados'

  const tbody = document.getElementById('tabelaFinanceiro')
  if (!tbody) return
  tbody.innerHTML = dados.length ? dados.map(f => `
    <tr>
      <td>${fmtData(f.data)}</td><td>${f.hora||'—'}</td>
      <td><b style="color:#F2F2F2">${f.cliente||'—'}</b></td>
      <td><span class="badge badge-atendido">${f.servico||'—'}</span></td>
      <td style="text-align:right;color:#00c878;font-weight:700">${fmtMoeda(f.valor)}</td>
    </tr>`).join('')
  : '<tr><td colspan="5" class="empty">Nenhum atendimento realizado ainda.</td></tr>'
}

const hoje = new Date()
document.getElementById('filtroMes').value =
  hoje.getFullYear()+'-'+String(hoje.getMonth()+1).padStart(2,'0')
renderFinanceiro()
