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

const ARQ = require('path').join(DATA_DIR, 'servicos.json')

function garantir() {
  const dir = path.dirname(ARQ)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(ARQ)) fs.writeFileSync(ARQ, '[]', 'utf8')
}
function ler() {
  try { garantir(); return JSON.parse(fs.readFileSync(ARQ, 'utf8').trim() || '[]') }
  catch(e) { return [] }
}
function salvar(dados) {
  try { garantir(); fs.writeFileSync(ARQ, JSON.stringify(dados, null, 2), 'utf8') }
  catch(e) { console.error(e) }
}
function fmtMoeda(v) {
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
}
function aviso(tipo, msg) {
  const el    = document.getElementById(tipo==='ok' ? 'avisoOk' : 'avisoErro')
  const outro = document.getElementById(tipo==='ok' ? 'avisoErro' : 'avisoOk')
  if (outro) outro.style.display = 'none'
  if (!el) return
  el.textContent = msg; el.style.display = 'block'
  setTimeout(() => el.style.display = 'none', tipo==='ok' ? 3000 : 4000)
}

function salvarServico() {
  const nome   = document.getElementById('nomeServico').value.trim()
  const valor  = document.getElementById('valorServico').value
  const editId = document.getElementById('editandoId').value

  if (!nome)                        return aviso('erro', 'Informe o nome do serviço.')
  if (!valor || Number(valor) <= 0) return aviso('erro', 'Informe um valor válido.')

  let lista = ler()

  if (editId) {
    // EDITAR
    lista = lista.map(s => s.id === Number(editId) ? { ...s, nome, valor: Number(valor) } : s)
    salvar(lista)
    aviso('ok', 'Serviço atualizado!')
    cancelarEdicao()
  } else {
    // NOVO
    if (lista.find(s => s.nome.toLowerCase() === nome.toLowerCase()))
      return aviso('erro', 'Já existe um serviço com esse nome.')
    lista.push({ id: Date.now(), nome, valor: Number(valor) })
    salvar(lista)
    aviso('ok', 'Serviço "' + nome + '" cadastrado!')
    document.getElementById('nomeServico').value = ''
    document.getElementById('valorServico').value = ''
  }
  renderServicos()
}

function editarServico(id) {
  const s = ler().find(x => x.id === id)
  if (!s) return
  document.getElementById('nomeServico').value   = s.nome
  document.getElementById('valorServico').value  = s.valor
  document.getElementById('editandoId').value    = id
  document.getElementById('formTitulo').textContent = '✏️ Editar Serviço'
  document.getElementById('btnSalvar').textContent  = '💾 Salvar Alteração'
  document.getElementById('btnCancelar').style.display = 'inline-flex'
  document.getElementById('nomeServico').focus()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelarEdicao() {
  document.getElementById('nomeServico').value  = ''
  document.getElementById('valorServico').value = ''
  document.getElementById('editandoId').value   = ''
  document.getElementById('formTitulo').textContent = 'Novo Serviço'
  document.getElementById('btnSalvar').textContent  = '+ Adicionar'
  document.getElementById('btnCancelar').style.display = 'none'
}

function excluirServico(id) {
  salvar(ler().filter(s => s.id !== id))
  renderServicos()
}

function renderServicos() {
  const lista = ler()
  const count = document.getElementById('countServicos')
  if (count) count.textContent = lista.length + ' serviço(s)'
  const tbody = document.getElementById('tabelaServicos')
  if (!tbody) return
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="3" class="empty">Nenhum serviço cadastrado.</td></tr>'; return }
  tbody.innerHTML = lista.map(s => `
    <tr>
      <td><b style="color:#F2F2F2">${s.nome}</b></td>
      <td style="text-align:right;color:#00c878;font-weight:700">${fmtMoeda(s.valor)}</td>
      <td style="text-align:center;white-space:nowrap">
        <button class="btn-edit" onclick="editarServico(${s.id})" title="Editar">✏️</button>
        <button class="btn-danger" onclick="excluirServico(${s.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('')
}

renderServicos()
