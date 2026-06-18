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

const ARQ_AGENDA     = path.join(DATA_DIR, 'agenda.json')
const ARQ_CLIENTES   = path.join(DATA_DIR, 'clientes.json')
const ARQ_SERVICOS   = path.join(DATA_DIR, 'servicos.json')

function garantir(arq) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(arq)) fs.writeFileSync(arq, '[]', 'utf8')
}
function ler(arq) {
  try { garantir(arq); return JSON.parse(fs.readFileSync(arq, 'utf8').trim() || '[]') }
  catch(e) { return [] }
}
function salvarArq(arq, dados) {
  try { garantir(arq); fs.writeFileSync(arq, JSON.stringify(dados, null, 2), 'utf8') }
  catch(e) { console.error(e) }
}
function fmtMoeda(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function fmtData(d) {
  if (!d) return '—'; const p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]
}
// Verifica se o agendamento já passou
function jaPassou(data, hora) {
  const agora = new Date()
  const dt    = new Date(data + 'T' + (hora || '23:59') + ':00')
  return dt < agora
}

function aviso(tipo, msg) {
  const el    = document.getElementById(tipo==='ok' ? 'avisoOk' : 'avisoErro')
  const outro = document.getElementById(tipo==='ok' ? 'avisoErro' : 'avisoOk')
  if (outro) outro.style.display = 'none'
  if (!el) return
  el.textContent = msg; el.style.display = 'block'
  setTimeout(() => el.style.display = 'none', tipo==='ok' ? 3000 : 4000)
}

// ── AUTOCOMPLETE CLIENTE ────────────────────────────────────
let acIdx = -1
let clientesList = []

function carregarClientesAC() {
  clientesList = ler(ARQ_CLIENTES)
}

function filtrarClientes() {
  const busca = document.getElementById('clienteBusca').value.toLowerCase().trim()
  document.getElementById('clienteSelecionado').value = ''
  const list  = document.getElementById('acList')
  if (!busca) { list.style.display = 'none'; return }

  const matches = clientesList.filter(c =>
    c.nome.toLowerCase().includes(busca) || (c.telefone || '').includes(busca)
  ).slice(0, 8)

  if (!matches.length) { list.style.display = 'none'; return }

  list.innerHTML = matches.map((c, i) => `
    <div class="autocomplete-item" data-nome="${c.nome}" data-idx="${i}"
      onmousedown="selecionarCliente('${c.nome.replace(/'/g,"\\'")}')">
      <span>${c.nome}</span>
      <small>${c.telefone || 'Sem telefone cadastrado'}</small>
    </div>`).join('')
  list.style.display = 'block'
  acIdx = -1
}

function selecionarCliente(nome) {
  document.getElementById('clienteBusca').value = nome
  document.getElementById('clienteSelecionado').value = nome
  document.getElementById('acList').style.display = 'none'
}

function navAutoComplete(e) {
  const list  = document.getElementById('acList')
  const items = list.querySelectorAll('.autocomplete-item')
  if (!items.length || list.style.display === 'none') return
  if (e.key === 'ArrowDown') { acIdx = Math.min(acIdx+1, items.length-1); atualizarAC(items) }
  else if (e.key === 'ArrowUp') { acIdx = Math.max(acIdx-1, 0); atualizarAC(items) }
  else if (e.key === 'Enter' && acIdx >= 0) { e.preventDefault(); selecionarCliente(items[acIdx].dataset.nome) }
  else if (e.key === 'Escape') { list.style.display = 'none' }
}

function atualizarAC(items) {
  items.forEach((el, i) => el.classList.toggle('selected', i === acIdx))
  if (acIdx >= 0) items[acIdx].scrollIntoView({ block: 'nearest' })
}

// Fechar autocomplete ao clicar fora
document.addEventListener('click', e => {
  if (!document.getElementById('acWrap')?.contains(e.target))
    document.getElementById('acList').style.display = 'none'
})

// ── SERVIÇOS SELECT ─────────────────────────────────────────
function carregarServicosSelect(selectId) {
  const servicos = ler(ARQ_SERVICOS)
  const sel = document.getElementById(selectId)
  sel.innerHTML = '<option value="">Selecione o serviço...</option>'
  servicos.forEach(s => {
    const o = document.createElement('option')
    o.value = JSON.stringify({ nome: s.nome, valor: s.valor })
    o.text  = s.nome + ' — R$ ' + Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits:2 })
    sel.appendChild(o)
  })
}

// ── SALVAR ATENDIMENTO ───────────────────────────────────────
function salvarAtendimento() {
  const data    = document.getElementById('data').value
  const hora    = document.getElementById('hora').value
  const cliente = document.getElementById('clienteSelecionado').value
  const svcRaw  = document.getElementById('servicoSelect').value
  if (!data)    return aviso('erro', 'Selecione a data.')
  if (!hora)    return aviso('erro', 'Informe o horário.')
  if (!cliente) return aviso('erro', 'Selecione um cliente da lista.')
  if (!svcRaw)  return aviso('erro', 'Selecione um serviço.')
  const svc    = JSON.parse(svcRaw)
  const agenda = ler(ARQ_AGENDA)
  agenda.push({ id: Date.now(), data, hora, cliente, servico: svc.nome, valor: svc.valor })
  salvarArq(ARQ_AGENDA, agenda)
  aviso('ok', 'Atendimento agendado!')
  document.getElementById('hora').value = ''
  document.getElementById('clienteBusca').value = ''
  document.getElementById('clienteSelecionado').value = ''
  document.getElementById('servicoSelect').value = ''
  renderAgenda()
}

// ── EXCLUIR ──────────────────────────────────────────────────
function excluirAtendimento(id) {
  salvarArq(ARQ_AGENDA, ler(ARQ_AGENDA).filter(a => a.id !== id))
  renderAgenda()
}

// ── EDIÇÃO ───────────────────────────────────────────────────
function abrirEdicao(id) {
  const a = ler(ARQ_AGENDA).find(x => x.id === id)
  if (!a) return
  document.getElementById('editId').value   = id
  document.getElementById('editData').value = a.data
  document.getElementById('editHora').value = a.hora
  carregarServicosSelect('editServico')
  // pré-selecionar serviço atual
  const sel = document.getElementById('editServico')
  for (let i = 0; i < sel.options.length; i++) {
    try {
      if (JSON.parse(sel.options[i].value).nome === a.servico) { sel.selectedIndex = i; break }
    } catch(e) {}
  }
  document.getElementById('modalEdit').style.display = 'flex'
}

function fecharModal(e) {
  if (e.target === document.getElementById('modalEdit'))
    document.getElementById('modalEdit').style.display = 'none'
}

function salvarEdicao() {
  const id      = Number(document.getElementById('editId').value)
  const data    = document.getElementById('editData').value
  const hora    = document.getElementById('editHora').value
  const svcRaw  = document.getElementById('editServico').value
  if (!data || !hora || !svcRaw) return
  const svc    = JSON.parse(svcRaw)
  const agenda = ler(ARQ_AGENDA).map(a =>
    a.id === id ? { ...a, data, hora, servico: svc.nome, valor: svc.valor } : a
  )
  salvarArq(ARQ_AGENDA, agenda)
  document.getElementById('modalEdit').style.display = 'none'
  renderAgenda()
}

// ── FILTROS E RENDER ─────────────────────────────────────────
function limparFiltro() {
  document.getElementById('filtroData').value   = ''
  document.getElementById('filtroStatus').value = ''
  renderAgenda()
}

function renderAgenda() {
  const filtroData   = document.getElementById('filtroData').value
  const filtroStatus = document.getElementById('filtroStatus').value
  let lista = ler(ARQ_AGENDA)
  if (filtroData)   lista = lista.filter(a => a.data === filtroData)
  if (filtroStatus === 'atendido') lista = lista.filter(a => jaPassou(a.data, a.hora))
  if (filtroStatus === 'pendente') lista = lista.filter(a => !jaPassou(a.data, a.hora))
  lista = [...lista].sort((a, b) => {
    const da = new Date(a.data + 'T' + (a.hora||'00:00'))
    const db = new Date(b.data + 'T' + (b.hora||'00:00'))
    return da - db
  }).reverse()

  const count = document.getElementById('countAgenda')
  if (count) count.textContent = lista.length + ' agendamento(s)'

  const tbody = document.getElementById('tabelaAgenda')
  if (!tbody) return
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">Nenhum atendimento encontrado.</td></tr>'
    return
  }

  tbody.innerHTML = lista.map(a => {
    const passou = jaPassou(a.data, a.hora)
    const badge  = passou
      ? '<span class="badge badge-atendido">Atendido</span>'
      : '<span class="badge badge-pendente">Agendado</span>'
    return `<tr>
      <td>${fmtData(a.data)}</td>
      <td>${a.hora||'—'}</td>
      <td><b style="color:#F2F2F2">${a.cliente}</b></td>
      <td><span class="badge badge-blue">${a.servico}</span></td>
      <td>${badge}</td>
      <td style="text-align:right;color:#00c878;font-weight:700">${fmtMoeda(a.valor)}</td>
      <td style="text-align:center;white-space:nowrap">
        <button class="btn-danger" onclick="abrirEdicao(${a.id})" title="Editar" style="color:#4a90d9">✏️</button>
        <button class="btn-danger" onclick="excluirAtendimento(${a.id})" title="Excluir">🗑</button>
      </td>
    </tr>`
  }).join('')
}

// ── INIT ─────────────────────────────────────────────────────
document.getElementById('data').value = new Date().toISOString().split('T')[0]
carregarClientesAC()
carregarServicosSelect('servicoSelect')
renderAgenda()
