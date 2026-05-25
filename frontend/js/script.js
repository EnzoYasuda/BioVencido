// ═══════════════════════════════════════════
//  BioVencido — script.js
// ═══════════════════════════════════════════

// ── SESSÃO: redireciona para login se não estiver logado ──
const _sessao = sessionStorage.getItem('usuario')
if (!_sessao) window.location.href = 'pages/login.html'

const API        = 'http://localhost:3000'
const USUARIO_ID = JSON.parse(_sessao)?.id || 1

// ── EMOJIS E LABELS POR CATEGORIA ──
const EMOJIS = {
  laticinio: '🧀', grao: '🌾', fruta: '🍎',
  verdura: '🥦', bebida: '🥛', carne: '🥩', outro: '📦'
}
const CAT_LABELS = {
  laticinio: 'Laticínio', grao: 'Grão', fruta: 'Fruta',
  verdura: 'Verdura', bebida: 'Bebida', carne: 'Carne', outro: 'Outro'
}

// ── ESTADO GLOBAL ──
let products     = []
let activeFilter = 'todos'
let searchTerm   = ''

// ════════════════════════════════════════════
//  NAVEGAÇÃO
// ════════════════════════════════════════════
function navigate(sectionId, el) {
  event.preventDefault()
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById(sectionId).classList.add('active')
  el.closest('.nav-item').classList.add('active')
}

// ════════════════════════════════════════════
//  UTILITÁRIOS DE VALIDADE
// ════════════════════════════════════════════
function daysLeft(expiryStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exp   = new Date(expiryStr); exp.setHours(0, 0, 0, 0)
  return Math.round((exp - today) / 86400000)
}

function getStatus(days) {
  if (days < 0)  return 'expired'
  if (days <= 3) return 'crit'
  if (days <= 7) return 'warn'
  return 'ok'
}

function badgeInfo(days) {
  if (days < 0)   return { cls: 'badge-expired', text: `Vencido há ${Math.abs(days)} dias` }
  if (days === 0) return { cls: 'badge-crit',    text: 'Vence hoje!' }
  if (days <= 3)  return { cls: 'badge-crit',    text: `⚠️ Vence em ${days} dia${days > 1 ? 's' : ''}` }
  if (days <= 7)  return { cls: 'badge-warn',    text: `🟡 Vence em ${days} dias` }
  return { cls: 'badge-ok', text: `✅ ${days} dias restantes` }
}

function formatDate(str) {
  return new Date(str + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ════════════════════════════════════════════
//  DESPENSA
// ════════════════════════════════════════════
async function loadProducts() {
  try {
    const res  = await fetch(`${API}/itens?usuarioId=${USUARIO_ID}`)
    const data = await res.json()
    products = data.map(item => ({
      id:        item.id,
      name:      item.nome,
      category:  item.categoria || 'outro',
      expiry:    item.dataValidade.split('T')[0],
      qty:       String(item.quantidade),
      note:      item.observacoes || '',
      aberto:    item.aberto,
      terminado: item.terminado
    }))
    renderProducts()
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    showToast('❌ Erro ao conectar ao servidor.')
  }
}

function renderProducts() {
  const grid = document.getElementById('productGrid')
  let filtered = [...products]

  if (activeFilter !== 'todos')
    filtered = filtered.filter(p => p.category === activeFilter)
  if (searchTerm)
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-light);">
      Nenhum produto encontrado. Adicione seu primeiro item! 🥦</div>`
    updateStats()
    return
  }

  grid.innerHTML = filtered.map(p => {
    const days   = daysLeft(p.expiry)
    const status = getStatus(days)
    const badge  = badgeInfo(days)
    return `
      <div class="product-card status-${status}" data-id="${p.id}">
        <span class="product-emoji">${EMOJIS[p.category] || '📦'}</span>
        <div class="product-name">${p.name}</div>
        <div class="product-category">${CAT_LABELS[p.category] || 'Outro'}</div>
        <div class="product-meta">
          <div class="meta-row">
            <span class="meta-label">Quantidade</span>
            <span class="meta-value">${p.qty || '—'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Validade</span>
            <span class="meta-value">${formatDate(p.expiry)}</span>
          </div>
          ${p.aberto    ? `<div class="meta-row"><span class="meta-label">Status</span><span class="meta-value">📂 Aberto</span></div>` : ''}
          ${p.terminado ? `<div class="meta-row"><span class="meta-label">Status</span><span class="meta-value">✅ Terminado</span></div>` : ''}
          ${p.note ? `<div class="meta-row">
            <span class="meta-label">Obs.</span>
            <span class="meta-value">${p.note}</span>
          </div>` : ''}
        </div>
        <div class="expiry-badge ${badge.cls}">${badge.text}</div>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})">✏️ Editar</button>
          <button class="btn btn-sm" style="background:#fdecea;color:#c62828;border:none;"
            onclick="removeProduct(${p.id})">🗑️ Remover</button>
        </div>
      </div>`
  }).join('')

  updateStats()
}

function updateStats() {
  let ok = 0, warn = 0, crit = 0
  products.forEach(p => {
    const d = daysLeft(p.expiry)
    if (d > 7)      ok++
    else if (d > 3) warn++
    else            crit++
  })
  document.getElementById('totalCount').textContent = products.length
  document.getElementById('okCount').textContent    = ok
  document.getElementById('warnCount').textContent  = warn
  document.getElementById('critCount').textContent  = crit
}

function filterProducts(cat, el) {
  activeFilter = cat
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
  renderProducts()
}

function searchProducts(val) {
  searchTerm = val
  renderProducts()
}

// ── Modal ──
function openModal() {
  document.getElementById('modalOverlay').classList.add('open')
  document.getElementById('newExpiry').min = new Date().toISOString().split('T')[0]
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open')
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal()
}

// ── Adicionar produto ──
async function addProduct() {
  const name   = document.getElementById('newName').value.trim()
  const expiry = document.getElementById('newExpiry').value
  if (!name || !expiry) { alert('Preencha nome e validade!'); return }

  try {
    await fetch(`${API}/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome:         name,
        categoria:    document.getElementById('newCategory').value,
        dataValidade: expiry,
        dataCompra:   new Date().toISOString().split('T')[0],
        quantidade:   parseInt(document.getElementById('newQty').value) || 1,
        observacoes:  document.getElementById('newNotes').value,
        usuarioId:    USUARIO_ID
      })
    })
    await loadProducts()
    closeModal()
    showToast('✅ Produto adicionado!')
    ;['newName','newExpiry','newQty','newNotes'].forEach(id =>
      document.getElementById(id).value = '')
  } catch (err) {
    showToast('❌ Erro ao salvar produto.')
  }
}

// ── Remover produto ──
async function removeProduct(id) {
  if (!confirm('Remover este produto da despensa?')) return
  try {
    await fetch(`${API}/itens/${id}`, { method: 'DELETE' })
    await loadProducts()
    showToast('🗑️ Produto removido.')
  } catch (err) {
    showToast('❌ Erro ao remover produto.')
  }
}

// ── Editar produto ──
function editProduct(id) {
  const p = products.find(x => x.id === id)
  if (!p) return
  document.getElementById('newName').value     = p.name
  document.getElementById('newCategory').value = p.category
  document.getElementById('newExpiry').value   = p.expiry
  document.getElementById('newQty').value      = p.qty
  document.getElementById('newNotes').value    = p.note
  removeProduct(id)
  openModal()
}

// ════════════════════════════════════════════
//  RECEITAS
// ════════════════════════════════════════════
async function loadRecipes() {
  try {
    const res  = await fetch(`${API}/receitas`)
    const data = await res.json()
    if (data.length === 0) { renderRecipesFallback(); return }

    document.getElementById('recipeGrid').innerHTML = data.map(r => `
      <div class="recipe-card">
        <div class="recipe-img">🍽️</div>
        <div class="recipe-body">
          <div class="recipe-title">${r.nome}</div>
          <div class="recipe-desc">${r.descricao || r.modoPreparo.substring(0, 100) + '...'}</div>
          <div class="recipe-tags">
            <span class="recipe-tag">${r.categoria}</span>
          </div>
          <div class="recipe-meta-row">
            ${r.tempoPreparoMin ? `<span>⏱ ${r.tempoPreparoMin} min</span>` : ''}
            <span>👨‍🍳 ${r.nivelDificuldade}</span>
          </div>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--creme-dark);">
            <button class="btn btn-primary btn-sm">Ver receita completa</button>
          </div>
        </div>
      </div>`).join('')
  } catch (err) {
    renderRecipesFallback()
  }
}

function renderRecipesFallback() {
  const recipes = [
    { emoji:'🍕', title:'Pizza caseira rápida', time:'30 min', diff:'Fácil',
      desc:'Aproveite o queijo mussarela e o tomate que estão quase vencendo.', tags:['Queijo','Tomate'], urgent:true },
    { emoji:'🥞', title:'Panquecas de leite', time:'20 min', diff:'Fácil',
      desc:'Receita clássica para usar o leite próximo da validade.', tags:['Leite'], urgent:true },
    { emoji:'🥗', title:'Salada de espinafre', time:'10 min', diff:'Fácil',
      desc:'Combinação refrescante com ingredientes frescos.', tags:['Espinafre','Maçã'], urgent:false },
  ]
  document.getElementById('recipeGrid').innerHTML = recipes.map(r => `
    <div class="recipe-card">
      <div class="recipe-img">${r.emoji}</div>
      <div class="recipe-body">
        <div class="recipe-title">${r.title}</div>
        <div class="recipe-desc">${r.desc}</div>
        <div class="recipe-tags">
          ${r.tags.map(t => `<span class="recipe-tag ${r.urgent ? 'urgent':''}">${t}</span>`).join('')}
        </div>
        <div class="recipe-meta-row">
          <span>⏱ ${r.time}</span>
          <span>👨‍🍳 ${r.diff}</span>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--creme-dark);">
          <button class="btn btn-primary btn-sm">Ver receita completa</button>
        </div>
      </div>
    </div>`).join('')
}

// ════════════════════════════════════════════
//  PERFIL DO USUÁRIO
// ════════════════════════════════════════════

// Carrega nome do usuário logado na sidebar e preenche o formulário de perfil
function carregarPerfil() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  if (!usuario) return

  const footerEl = document.querySelector('.sidebar-footer')
  if (footerEl) {
    footerEl.innerHTML = `👤 ${usuario.nome}<br><small style="color:var(--verde-light)">${usuario.email}</small>
      <br><br><a href="#" onclick="sair()" style="color:var(--terra-light);font-size:12px;">Sair</a>`
  }

  // Carrega preferências do backend (com fallback para localStorage)
  carregarPreferenciasDoBackend(usuario.id)

  // Carrega endereço do backend
  carregarEnderecoDoBackend(usuario.id)
}

function sair() {
  sessionStorage.removeItem('usuario')
  window.location.href = 'pages/login.html'
}

// ── Tags de alergia ──
function addTag(e, input) {
  if (e.key !== 'Enter') return
  const val = input.value.trim()
  if (!val) return
  const tag = document.createElement('span')
  tag.className = 'alergia-tag'
  tag.innerHTML = `${val} <button onclick="removeTag(this)">×</button>`
  input.parentNode.insertBefore(tag, input)
  input.value = ''
}

function removeTag(btn) { btn.parentElement.remove() }

function formatCEP(input) {
  input.value = input.value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}

// ── Carrega endereço salvo no backend e preenche o formulário ──
async function carregarEnderecoDoBackend(usuarioId) {
  try {
    const res = await fetch(`${API}/endereco?usuarioId=${usuarioId}`)
    if (!res.ok) return
    const lista = await res.json()
    if (!lista.length) return

    const e = lista[0]

    // Persiste o id no localStorage (sobrevive a refresh, ao contrário do sessionStorage)
    localStorage.setItem(`enderecoId_${usuarioId}`, e.id)

    // Preenche pelos ids dos campos (robustos, independem de ordem no DOM)
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || '' }
    set('cepInput',  e.cep)
    set('endRua',    e.rua)
    set('endNumero', e.numero)
    set('endBairro', e.bairro)
    set('endCidade', e.cidade)

    atualizarBlocoEndereco(e)
  } catch (err) {
    console.warn('Não foi possível carregar endereço:', err)
  }
}

// ── Carrega alergias, dietas e notificações do BACKEND ──
async function carregarPreferenciasDoBackend(usuarioId) {
  try {
    console.log('🔵 Carregando preferências do usuário:', usuarioId);
    
    const res = await fetch(`${API}/usuario/${usuarioId}`)
    if (!res.ok) {
      console.warn('Não foi possível carregar preferências do usuário, usando localStorage')
      carregarPreferenciasLocais(usuarioId)
      return
    }
    
    const usuario = await res.json()
    console.log('📥 Preferências carregadas:', {
      alergias: usuario.alergias,
      dietas: usuario.dietas,
      notificacoes: usuario.notificacoes
    });
    
    const alergias = usuario.alergias || []
    const dietas = usuario.dietas || []
    const notificacoes = usuario.notificacoes || []

    // Alergias
    if (alergias.length) {
      const area = document.getElementById('alergiaArea')
      if (area) {
        area.querySelectorAll('.alergia-tag').forEach(t => t.remove())
        const input = area.querySelector('input')
        alergias.forEach(val => {
          const tag = document.createElement('span')
          tag.className = 'alergia-tag'
          tag.innerHTML = `${val} <button onclick="removeTag(this)">×</button>`
          area.insertBefore(tag, input)
        })
      }
    }

    // Dietas
    if (dietas.length) {
      document.querySelectorAll('#dietaGroup .checkbox-item').forEach(label => {
        const texto = label.textContent.trim()
        const ativo = dietas.includes(texto)
        label.classList.toggle('checked', ativo)
        const cb = label.querySelector('input[type="checkbox"]')
        if (cb) cb.checked = ativo
      })
    }

    // Notificações
    if (notificacoes.length) {
      document.querySelectorAll('.profile-card .checkbox-group .checkbox-item').forEach(label => {
        if (label.closest('#dietaGroup')) return // pula dietas
        const texto = label.textContent.trim()
        const ativo = notificacoes.includes(texto)
        label.classList.toggle('checked', ativo)
        const cb = label.querySelector('input[type="checkbox"]')
        if (cb) cb.checked = ativo
      })
    }
  } catch (err) {
    console.warn('Erro ao carregar preferências do backend:', err)
    // Fallback para localStorage
    carregarPreferenciasLocais(usuarioId)
  }
}

// ── Carrega alergias, dietas e notificações do localStorage (fallback) ──
function carregarPreferenciasLocais(usuarioId) {
  const chave = `perfil_prefs_${usuarioId}`
  const salvo = JSON.parse(localStorage.getItem(chave) || 'null')
  if (!salvo) return

  // Alergias
  if (salvo.alergias?.length) {
    const area = document.getElementById('alergiaArea')
    if (area) {
      area.querySelectorAll('.alergia-tag').forEach(t => t.remove())
      const input = area.querySelector('input')
      salvo.alergias.forEach(val => {
        const tag = document.createElement('span')
        tag.className = 'alergia-tag'
        tag.innerHTML = `${val} <button onclick="removeTag(this)">×</button>`
        area.insertBefore(tag, input)
      })
    }
  }

  // Dietas
  if (salvo.dietas?.length) {
    document.querySelectorAll('#dietaGroup .checkbox-item').forEach(label => {
      const texto = label.textContent.trim()
      const ativo = salvo.dietas.includes(texto)
      label.classList.toggle('checked', ativo)
      const cb = label.querySelector('input[type="checkbox"]')
      if (cb) cb.checked = ativo
    })
  }

  // Notificações
  if (salvo.notificacoes?.length) {
    document.querySelectorAll('.profile-card .checkbox-group .checkbox-item').forEach(label => {
      if (label.closest('#dietaGroup')) return // pula dietas
      const texto = label.textContent.trim()
      const ativo = salvo.notificacoes.includes(texto)
      label.classList.toggle('checked', ativo)
      const cb = label.querySelector('input[type="checkbox"]')
      if (cb) cb.checked = ativo
    })
  }
}

// ── Coleta todos os dados do formulário de perfil ──
function coletarDadosPerfil() {
  // Alergias
  const alergias = []
  document.querySelectorAll('#alergiaArea .alergia-tag').forEach(tag => {
    alergias.push(tag.childNodes[0].textContent.trim())
  })

  // Dietas marcadas
  const dietas = []
  document.querySelectorAll('#dietaGroup .checkbox-item').forEach(label => {
    if (label.classList.contains('checked')) dietas.push(label.textContent.trim())
  })

  // Campos de endereço lidos pelos ids do index.html
  const get = id => document.getElementById(id)?.value.trim() || ''
  const endereco = {
    cep:    get('cepInput'),
    rua:    get('endRua'),
    numero: get('endNumero'),
    bairro: get('endBairro'),
    cidade: get('endCidade'),
    estado: '',
  }

  // Notificações
  const notificacoes = []
  document.querySelectorAll('.profile-card .checkbox-group .checkbox-item').forEach(label => {
    if (label.closest('#dietaGroup')) return
    if (label.classList.contains('checked')) notificacoes.push(label.textContent.trim())
  })

  return { alergias, dietas, endereco, notificacoes }
}

// ── Atualiza o bloco visual de endereço ──
function atualizarBlocoEndereco(e) {
  const bloco = document.querySelector('.address-block')
  if (!bloco) return
  if (!e.rua && !e.cidade) return
  const linha1 = [e.rua, e.numero ? `nº ${e.numero}` : '', e.bairro].filter(Boolean).join(', ')
  const linha2 = [e.cidade, e.cep ? `CEP ${e.cep}` : ''].filter(Boolean).join(' — ')
  bloco.querySelector('.address-text').innerHTML =
    `<strong>Endereço salvo</strong>${linha1}<br>${linha2}`
}

// ── Salva endereço no backend (upsert: PATCH se já existe, POST se não) ──
async function salvarEnderecoNoBackend(endereco, usuarioId) {
  // Valida se há pelo menos um campo preenchido
  const temDados = endereco.rua || endereco.numero || endereco.cidade || endereco.bairro || endereco.cep;
  if (!temDados) {
    console.log('⚠️ Endereço vazio, não salvando');
    return { ok: true };
  }

  // localStorage sobrevive a refresh; sessionStorage não
  const enderecoId = localStorage.getItem(`enderecoId_${usuarioId}`)
  const body = { ...endereco, usuarioId }

  console.log('💾 Salvando endereço:', { enderecoId, body });

  if (enderecoId) {
    const res = await fetch(`${API}/endereco/${enderecoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    console.log('✅ Endereço atualizado:', res.status);
    return res
  } else {
    const res = await fetch(`${API}/endereco`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    console.log('✅ Endereço criado:', res.status);
    if (res.ok) {
      const criado = await res.json()
      localStorage.setItem(`enderecoId_${usuarioId}`, criado.id)
    }
    return res
  }
}

// ── Salva todo o perfil ──
async function saveProfile() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  if (!usuario) return

  const dados = coletarDadosPerfil()

  console.log('💾 Salvando perfil para usuário:', usuario.id);
  console.log('📤 Dados coletados:', dados);

  try {
    // 1. Salva alergias, dietas e notificações no BACKEND
    const resUpdate = await fetch(`${API}/usuario/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alergias:     dados.alergias,
        dietas:       dados.dietas,
        notificacoes: dados.notificacoes
      })
    })

    console.log('✅ Resposta do servidor:', resUpdate.status);

    if (!resUpdate.ok) {
      console.warn('Erro ao atualizar perfil:', resUpdate.status)
      showToast('⚠️ Erro ao salvar alergias/dietas no servidor.')
    } else {
      // Atualiza o sessionStorage com os dados atualizados
      const usuarioAtualizado = await resUpdate.json()
      console.log('📥 Dados retornados do servidor:', usuarioAtualizado);
      
      sessionStorage.setItem('usuario', JSON.stringify({
        ...usuario,
        alergias:     usuarioAtualizado.alergias,
        dietas:       usuarioAtualizado.dietas,
        notificacoes: usuarioAtualizado.notificacoes
      }))
    }
  } catch (err) {
    console.warn('Erro ao salvar perfil no servidor:', err)
    showToast('⚠️ Erro ao conectar ao servidor.')
  }

  // 2. Salva endereço no backend se algum campo estiver preenchido
  const { rua, cidade } = dados.endereco
  if (rua || cidade) {
    try {
      const res = await salvarEnderecoNoBackend(dados.endereco, usuario.id)
      if (!res.ok) console.warn('Resposta inesperada ao salvar endereço:', res.status)
    } catch (err) {
      console.warn('Erro ao salvar endereço no servidor:', err)
      // Não bloqueia — tenta salvar localmente de qualquer forma
    }
  }

  // 3. Atualiza bloco visual de endereço
  atualizarBlocoEndereco(dados.endereco)

  // 4. Exibe resumo na tela
  mostrarResumoPerfil(dados)

  showToast('✅ Perfil salvo com sucesso!')
}

// ── Exibe card de resumo logo abaixo do cabeçalho ──
function mostrarResumoPerfil(dados) {
  const secao = document.getElementById('usuario')
  let resumo  = secao.querySelector('.perfil-resumo')

  if (!resumo) {
    resumo = document.createElement('div')
    resumo.className = 'perfil-resumo'
    resumo.style.cssText = [
      'background:var(--creme-dark,#f1ede6)',
      'border:1.5px solid var(--verde,#5a7a5a)',
      'border-radius:12px',
      'padding:16px 20px',
      'margin-bottom:24px',
      'font-size:13px',
      'color:var(--text-dark,#333)',
      'line-height:1.8'
    ].join(';')
    secao.querySelector('.section-header').insertAdjacentElement('afterend', resumo)
  }

  const fmt = (arr, vazio) =>
    arr.length ? arr.join(' · ') : `<em style="color:#999">${vazio}</em>`

  const endStr = dados.endereco.rua
    ? [dados.endereco.rua, dados.endereco.numero, dados.endereco.cidade].filter(Boolean).join(', ')
    : null

  resumo.innerHTML = `
    <strong>✅ Perfil atualizado com sucesso!</strong><br>
    🤧 <strong>Alergias:</strong> ${fmt(dados.alergias, 'Nenhuma informada')}<br>
    🥗 <strong>Dietas:</strong> ${fmt(dados.dietas, 'Nenhuma selecionada')}<br>
    📍 <strong>Endereço:</strong> ${endStr ?? '<em style="color:#999">Não informado</em>'}<br>
    🔔 <strong>Notificações:</strong> ${fmt(dados.notificacoes, 'Nenhuma ativa')}
  `
}

// ════════════════════════════════════════════
//  PONTOS DE DESCARTE
// ════════════════════════════════════════════
async function loadDescarte() {
  try {
    const res    = await fetch(`${API}/despejo`)
    const locais = await res.json()
    if (locais.length === 0) { renderDescarteFallback(); return }

    document.getElementById('descarteList').innerHTML = locais.map(d => `
      <div class="descarte-card">
        <div class="descarte-icon">♻️</div>
        <div class="descarte-body">
          <div class="descarte-name">${d.nome}</div>
          ${d.endereco ? `<div class="descarte-address">📍 ${d.endereco.rua}, ${d.endereco.numero} — ${d.endereco.cidade}</div>` : ''}
          <div class="descarte-tags">
            ${d.tipoProduto ? `<span class="descarte-tag">${d.tipoProduto}</span>` : ''}
          </div>
          ${d.instrucoes ? `<p style="font-size:13px;color:var(--text-mid);margin:8px 0;">${d.instrucoes}</p>` : ''}
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" style="margin-left:auto;">Ver no Maps</button>
          </div>
        </div>
      </div>`).join('')
  } catch (err) {
    renderDescarteFallback()
  }
}

function renderDescarteFallback() {
  const points = [
    { icon:'🏛️', name:'CEDIR — Centro de Descarte',
      address:'Rua da Consolação, 240 — São Paulo', tags:['Alimentos','Produtos vencidos'], dist:'1,2 km', phone:'(11) 3333-4444' },
    { icon:'🌿', name:'Banco de Alimentos da Prefeitura',
      address:'Av. Paulista, 1578 — São Paulo', tags:['Doação','Não perecíveis'], dist:'2,8 km', phone:'(11) 3111-2222' },
    { icon:'♻️', name:'Ecoponto Pinheiros',
      address:'R. Teodoro Sampaio, 1000 — São Paulo', tags:['Orgânicos','Compostagem'], dist:'4,1 km', phone:'(11) 3999-5555' },
  ]
  document.getElementById('descarteList').innerHTML = points.map(d => `
    <div class="descarte-card">
      <div class="descarte-icon">${d.icon}</div>
      <div class="descarte-body">
        <div class="descarte-name">${d.name}</div>
        <div class="descarte-address">📍 ${d.address}</div>
        <div class="descarte-tags">
          ${d.tags.map(t => `<span class="descarte-tag">${t}</span>`).join('')}
        </div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
          <span class="descarte-dist">🚶 ${d.dist} de você</span>
          <span style="font-size:12px;color:var(--text-light);">📞 ${d.phone}</span>
          <button class="btn btn-secondary btn-sm" style="margin-left:auto;">Ver no Maps</button>
        </div>
      </div>
    </div>`).join('')
}

// ════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent     = msg
  t.style.transform = 'translateY(0)'
  t.style.opacity   = '1'
  setTimeout(() => {
    t.style.transform = 'translateY(80px)'
    t.style.opacity   = '0'
  }, 3000)
}

// ════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  carregarPerfil()
  loadProducts()
  loadRecipes()
  loadDescarte()
})