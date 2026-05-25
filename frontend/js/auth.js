// ═══════════════════════════════════════════
//  BioVencido — auth.js
//  Script de autenticação (login e cadastro)
// ═══════════════════════════════════════════

const API = 'http://localhost:3000'

// ── LOGIN ──
async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim()
  const senha = document.getElementById('loginSenha').value
  if (!email || !senha) { mostrarErro('Preencha email e senha.'); return }

  try {
    const res   = await fetch(`${API}/usuario`)
    const lista = await res.json()
    const usuario = lista.find(u => u.email === email)

    if (!usuario) {
      mostrarErro('Email não encontrado. Verifique ou crie uma conta.')
      return
    }

    sessionStorage.setItem('usuario', JSON.stringify(usuario))
    window.location.href = '../index.html'
  } catch (err) {
    mostrarErro('Erro ao conectar ao servidor.')
  }
}

// ── CADASTRO ──
async function criarConta() {
  const nome      = document.getElementById('cadNome').value.trim()
  const email     = document.getElementById('cadEmail').value.trim()
  const senha     = document.getElementById('cadSenha').value
  const senhaConf = document.getElementById('cadSenhaConf').value

  if (!nome || !email || !senha) { mostrarErro('Preencha todos os campos.'); return }
  if (senha.length < 6)          { mostrarErro('Senha com mínimo 6 caracteres.'); return }
  if (senha !== senhaConf)       { mostrarErro('As senhas não coincidem.'); return }

  try {
    const res  = await fetch(`${API}/usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    })
    const data = await res.json()
    if (!res.ok) { mostrarErro(data.error || 'Erro ao criar conta.'); return }

    sessionStorage.setItem('usuario', JSON.stringify(data))
    mostrarSucesso('Conta criada! Redirecionando...')
    setTimeout(() => window.location.href = '../index.html', 1500)
  } catch (err) {
    mostrarErro('Erro ao conectar ao servidor.')
  }
}

// ── UTILITÁRIOS ──
function mostrarErro(msg) {
  const sucesso = document.getElementById('successMsg')
  if (sucesso) sucesso.style.display = 'none'
  const el = document.getElementById('errorMsg')
  if (el) { el.textContent = msg; el.style.display = 'block' }
}

function mostrarSucesso(msg) {
  const erro = document.getElementById('errorMsg')
  if (erro) erro.style.display = 'none'
  const el = document.getElementById('successMsg')
  if (el) { el.textContent = msg; el.style.display = 'block' }
}

// ── Redireciona se já estiver logado ──
if (sessionStorage.getItem('usuario')) {
  window.location.href = '../index.html'
}