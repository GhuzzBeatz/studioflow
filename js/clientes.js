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

const ARQ = require('path').join(DATA_DIR, 'clientes.json')

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
function aviso(tipo, msg) {
  const el    = document.getElementById(tipo==='ok' ? 'avisoOk' : 'avisoErro')
  const outro = document.getElementById(tipo==='ok' ? 'avisoErro' : 'avisoOk')
  if (outro) outro.style.display = 'none'
  if (!el) return
  el.textContent = msg; el.style.display = 'block'
  setTimeout(() => el.style.display = 'none', tipo==='ok' ? 3000 : 4000)
}

function salvarCliente() {
  const nome = document.getElementById('nome').value.trim()
  const tel  = document.getElementById('telefone').value.trim()
  const cpf  = document.getElementById('cpf').value.trim()
  const obs  = document.getElementById('obs').value.trim()
  const editId = document.getElementById('editandoId').value

  if (!nome) return aviso('erro', 'Informe o nome do cliente.')

  let lista = ler()

  if (editId) {
    // EDITAR existente
    lista = lista.map(c => c.id === Number(editId) ? { ...c, nome, telefone: tel, cpf, obs } : c)
    salvar(lista)
    aviso('ok', 'Cliente atualizado!')
    cancelarEdicao()
  } else {
    // NOVO
    lista.push({ id: Date.now(), nome, telefone: tel, cpf, obs })
    salvar(lista)
    aviso('ok', 'Cliente "' + nome + '" cadastrado!')
    limparForm()
  }
  renderClientes()
}

function editarCliente(id) {
  const c = ler().find(x => x.id === id)
  if (!c) return
  document.getElementById('nome').value      = c.nome
  document.getElementById('telefone').value  = c.telefone || ''
  document.getElementById('cpf').value       = c.cpf || ''
  document.getElementById('obs').value       = c.obs || ''
  document.getElementById('editandoId').value = id
  document.getElementById('formTitulo').textContent = '✏️ Editar Cliente'
  document.getElementById('btnSalvar').textContent  = '💾 Salvar Alteração'
  document.getElementById('btnCancelar').style.display = 'inline-flex'
  document.getElementById('nome').focus()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelarEdicao() {
  limparForm()
  document.getElementById('editandoId').value = ''
  document.getElementById('formTitulo').textContent = 'Novo Cliente'
  document.getElementById('btnSalvar').textContent  = '+ Salvar Cliente'
  document.getElementById('btnCancelar').style.display = 'none'
}

function limparForm() {
  document.getElementById('nome').value     = ''
  document.getElementById('telefone').value = ''
  document.getElementById('cpf').value      = ''
  document.getElementById('obs').value      = ''
}

function excluirCliente(id) {
  salvar(ler().filter(c => c.id !== id))
  renderClientes()
}

function renderClientes() {
  const busca = (document.getElementById('busca')?.value || '').toLowerCase()
  const todos = ler()
  let lista = todos
  if (busca) lista = lista.filter(c =>
    c.nome.toLowerCase().includes(busca) || (c.telefone||'').includes(busca)
  )
  const count = document.getElementById('countClientes')
  if (count) count.textContent = todos.length + ' cliente(s)'
  const tbody = document.getElementById('tabelaClientes')
  if (!tbody) return
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhum cliente encontrado.</td></tr>'; return }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><b style="color:#F2F2F2">${c.nome}</b></td>
      <td>${c.telefone||'—'}</td>
      <td style="color:#888;font-size:12px">${c.cpf||'—'}</td>
      <td style="color:#888;font-size:12px">${c.obs||'—'}</td>
      <td style="text-align:center;white-space:nowrap">
        <button class="btn-edit" onclick="editarCliente(${c.id})" title="Editar">✏️</button>
        <button class="btn-danger" onclick="excluirCliente(${c.id})" title="Excluir">🗑️</button>
      </td>
    </tr>`).join('')
}

renderClientes()
