// ═══════════════════════════════════════════
//  BioVencido — script.js
// ═══════════════════════════════════════════

const _sessao = sessionStorage.getItem('usuario')
if (!_sessao) window.location.href = 'pages/login.html'

const API        = 'http://localhost:3000'
const USUARIO_ID = JSON.parse(_sessao)?.id || 1

const EMOJIS = {
  laticinio: '🧀', grao: '🌾', fruta: '🍎',
  verdura: '🥦', bebida: '🥛', carne: '🥩',
  ovo: '🥚', enlatado: '🥫', outro: '📦'
}
const CAT_LABELS = {
  laticinio: 'Laticínio', grao: 'Grão', fruta: 'Fruta',
  verdura: 'Verdura', bebida: 'Bebida', carne: 'Carne',
  ovo: 'Ovo', enlatado: 'Enlatado', outro: 'Outro'
}

let products     = []
let activeFilter = 'todos'
let searchTerm   = ''

// ── Toggle checkbox + classe visual ──
function toggleCheck(label) {
  const cb = label.querySelector('input[type="checkbox"]')
  if (!cb) return
  setTimeout(() => { label.classList.toggle('checked', cb.checked) }, 0)
}

// ════════════════════════════════════════════
//  NAVEGAÇÃO
// ════════════════════════════════════════════
function navigate(sectionId, el) {
  event.preventDefault()
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById(sectionId).classList.add('active')
  el.closest('.nav-item').classList.add('active')
  if (sectionId === 'receitas') loadRecipes()
  if (sectionId === 'descarte') loadDescarte()
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
    updateStats(); return
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
          <div class="meta-row"><span class="meta-label">Quantidade</span><span class="meta-value">${p.qty || '—'}</span></div>
          <div class="meta-row"><span class="meta-label">Validade</span><span class="meta-value">${formatDate(p.expiry)}</span></div>
          ${p.aberto    ? `<div class="meta-row"><span class="meta-label">Status</span><span class="meta-value">📂 Aberto</span></div>` : ''}
          ${p.terminado ? `<div class="meta-row"><span class="meta-label">Status</span><span class="meta-value">✅ Terminado</span></div>` : ''}
          ${p.note ? `<div class="meta-row"><span class="meta-label">Obs.</span><span class="meta-value">${p.note}</span></div>` : ''}
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
    if (d > 7) ok++; else if (d > 3) warn++; else crit++
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

function searchProducts(val) { searchTerm = val; renderProducts() }

function openModal() {
  document.getElementById('modalOverlay').classList.add('open')
  document.getElementById('newExpiry').min = new Date().toISOString().split('T')[0]
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open') }
function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal()
}

async function addProduct() {
  const name   = document.getElementById('newName').value.trim()
  const expiry = document.getElementById('newExpiry').value
  if (!name || !expiry) { alert('Preencha nome e validade!'); return }
  try {
    await fetch(`${API}/itens`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: name, categoria: document.getElementById('newCategory').value,
        dataValidade: expiry, dataCompra: new Date().toISOString().split('T')[0],
        quantidade: parseInt(document.getElementById('newQty').value) || 1,
        observacoes: document.getElementById('newNotes').value, usuarioId: USUARIO_ID
      })
    })
    await loadProducts(); closeModal(); showToast('✅ Produto adicionado!')
; ['newName','newExpiry','newQty','newNotes'].forEach(id =>
    document.getElementById(id).value = '')
    document.getElementById('newCategory').value = 'laticinio'
  } catch (err) { showToast('❌ Erro ao salvar produto.') }
}

async function removeProduct(id) {
  if (!confirm('Remover este produto da despensa?')) return
  try {
    await fetch(`${API}/itens/${id}`, { method: 'DELETE' })
    await loadProducts(); showToast('🗑️ Produto removido.')
  } catch (err) { showToast('❌ Erro ao remover produto.') }
}

function editProduct(id) {
  const p = products.find(x => x.id === id); if (!p) return
  document.getElementById('newName').value     = p.name
  document.getElementById('newCategory').value = p.category
  document.getElementById('newExpiry').value   = p.expiry
  document.getElementById('newQty').value      = p.qty
  document.getElementById('newNotes').value    = p.note
  removeProduct(id); openModal()
}

// ════════════════════════════════════════════
//  RECEITAS
// ════════════════════════════════════════════
function getEmojiReceita(categoriaReceita, nome) {
  const porNome = {
    'Vitamina de Banana':'🍌','Salada de Frutas':'🍓','Ovos Mexidos':'🍳',
    'Torrada com Abacate':'🥑','Suco de Laranja com Cenoura':'🍊','Iogurte com Granola':'🥣',
    'Omelete de Queijo':'🧀','Arroz Branco':'🍚','Feijao Simples':'🍲',
    'Banana Assada com Canela':'🍌','Macarrao ao Alho e Oleo':'🍝','Salpicao de Frango':'🥗',
    'Pure de Batata':'🥔','Sopa de Legumes':'🥣','Frango Grelhado':'🍗',
    'Risoto de Queijo':'🍚','Frango ao Molho de Tomate':'🍗','Quiche de Legumes':'🥧',
    'Carne Moida com Batata':'🥩','Peixe Assado com Ervas':'🐟','Torta de Legumes':'🥧',
    'Strogonoff de Frango':'🍗','Lasanha de Carne':'🍝','Curry de Grao-de-Bico':'🍛',
    'Frango Xadrez':'🥢','Caldo Verde':'🥬','Bolo de Cenoura':'🎂',
    'Pao de Forma Caseiro':'🍞','Moqueca de Peixe':'🐠','Hamburguer Artesanal':'🍔',
    'Sushi Caseiro':'🍣','Croissant Folhado':'🥐','Macarons Franceses':'🍬',
    'Beef Wellington':'🥩','Cheesecake New York':'🍰','Ramen Caseiro':'🍜',
    'Souffle de Queijo':'🧀','Pato a Laranja':'🍊','Tiramisu':'☕',
    'Boeuf Bourguignon':'🍷','Creme Brulee':'🍮','Brigadeiro Caseiro':'🍫',
    'Frango com Requeijao':'🍗','Bolinho de Arroz':'🍘','Mingau de Aveia':'🥣',
    'Pudim de Leite':'🍮','Panqueca de Leite':'🥞','Molho Branco Caseiro':'🍶',
    'Vitamina de Mamao':'🥭','Ovo Cozido Temperado':'🥚','Fritada de Legumes':'🍳',
    'Ovo Pochê':'🥚','Maionese Caseira':'🫙','Caldo de Frango':'🍲',
    'Frango a Parmegiana':'🍗','Frango Desfiado Refogado':'🍗','Picadinho de Carne':'🥩',
    'Almondega ao Molho':'🍝','Batata Assada':'🥔','Sopa Creme de Batata':'🥣',
    'Peixe na Frigideira':'🐟','Escabeche de Peixe':'🐠','Queijo Grelhado':'🧀',
    'Sanduiche Quente de Queijo':'🥪','Arroz de Forno':'🍚','Sopa de Arroz':'🥣',
    'Macarrao a Bolonhesa':'🍝','Macarrao de Forno':'🍝','Cenoura Refogada':'🥕',
    'Suco de Cenoura com Laranja':'🥕','Molho de Tomate Caseiro':'🍅',
    'Bruschetta de Tomate':'🍅','Sopa de Tomate':'🍅','Salada Caprese':'🍅',
    'Bolo de Banana':'🍌','Banana Foster':'🍌','Smoothie de Banana':'🥤',
    'Torta de Maca':'🍎','Salada de Maca com Atum':'🍎','Suco de Maca com Gengibre':'🍎',
    'Bolo de Laranja':'🍊','Frango ao Molho de Laranja':'🍊','Vinagrete de Laranja':'🍊',
    'Guacamole':'🥑','Mousse de Abacate':'🥑','Vitamina de Abacate':'🥑',
    'Limonada Suica':'🍋','Mousse de Limao':'🍋','Frango ao Limao':'🍋',
    'Espinafre Refogado':'🥬','Quiche de Espinafre':'🥬','Massa com Espinafre e Ricota':'🥬',
    'Brocolis Gratinado':'🥦','Sopa Creme de Brocolis':'🥦','Risoto de Cogumelo':'🍄',
    'Cogumelos Refogados':'🍄','Abobrinha Grelhada':'🥒','Nhoque de Abobrinha':'🥒',
    'Vitamina de Manga':'🥭','Salada de Manga com Camarao':'🥭','Chutney de Manga':'🥭',
    'Vitamina de Morango':'🍓','Mousse de Morango':'🍓','Geleia de Morango':'🍓',
    'Sopa Creme de Abobora':'🎃','Risoto de Abobora':'🎃','Feijoada Simples':'🍲',
    'Tutu de Feijao':'🍲','Molho de Iogurte para Salada':'🥣','Frango Marinado em Iogurte':'🍗',
    'Parfait de Iogurte':'🥣','Biscoito de Manteiga':'🍪','Sopa de Espinafre':'🥬',
    'Sopa de Cebola':'🧅','Camarao ao Alho e Oleo':'🦐',
    'Iogurte com Frutas Vermelhas':'🍓','Queijo com Geleia':'🧀',
    'Pudim de Chia com Leite':'🥛','Frango ao Creme de Leite':'🍗',
    'Omelete Recheado':'🍳','Cream Cheese com Salmao':'🐟','Iogurte com Nozes e Mel':'🥜',
    'Iogurte Natural com Canela':'🥣','Mousse de Ricota':'🍮',
    'Fattoush com Queijo Feta':'🥗','Espaguete ao Pesto com Parmesao':'🍝',
    'Salada de Frutas com Hortelã':'🍓','Torta de Banana com Aveia':'🍌',
    'Suco Verde Detox':'🥤','Nicecream de Banana':'🍌','Chia Pudding de Manga':'🥭',
    'Compota de Morango':'🍓','Pavlova de Frutas Vermelhas':'🍰','Mousse de Maracuja':'🍋',
    'Creme de Abacate com Tomate':'🥑','Wok de Legumes':'🥦','Sopa Minestrone':'🍲',
    'Lasanha de Legumes':'🍝','Ovo com Espinafre':'🥬','Frittata de Legumes':'🍳',
    'Zoodles ao Pesto':'🥒','Salada Caesar com Frango':'🥗','Frango Assado com Ervas':'🍗',
    'Peixe ao Molho de Ervas':'🐟','Bife Acebolado':'🥩','Frango com Brocolis':'🍗',
    'Atum com Salada Verde':'🐟','Arroz com Feijao':'🍚','Tabule':'🥗',
    'Macarrao Integral com Azeite':'🍝','Arroz de Legumes':'🍚',
    'Macarrao ao Pesto Vermelho':'🍝','Arroz com Coco':'🍚','Polenta Cremosa':'🌽',
    'Agua de Coco com Hortelã':'🥥','Kombucha de Gengibre':'🫙',
    'Suco de Beterraba com Maca':'🥤','Golden Milk':'🥛',
    'Vitamina de Abacaxi com Hortelã':'🍍','Tapioca Recheada':'🫓',
    'Crepioca':'🍳','Bowl de Acai':'🫐','Brigadeiro de Colher Sem Gluten':'🍫',
    // OVO
    'Shakshuka':'🍳','Ovo Estrelado Perfeito':'🥚','Ovos Benedict':'🥚',
    'Creme de Ovo':'🍮','Ovo Mexido Cremoso':'🥚','Tortilha Espanhola':'🍳',
    'Soufle de Queijo':'🧀',
    // ENLATADO
    'Macarrao com Atum':'🥫','Salada de Atum':'🥫','Patê de Atum':'🥫',
    'Arroz com Atum e Milho':'🥫','Sopa de Tomate com Grao de Bico':'🥫',
    'Sardinha Grelhada com Limaoo':'🐟','Pataniscas de Bacalhau':'🥫',
    'Feijao Tropeiro':'🥫','Wrap de Atum':'🥫','Sopa de Feijao com Linguica':'🥫',
    'Pizza de Sardinha':'🥫'
  }
  if (nome && porNome[nome]) return porNome[nome]
  const porCat = {
    'laticinio':'🧀','fruta':'🍎','verdura':'🥦','carne':'🍗',
    'grao':'🌾','bebida':'🥤','ovo':'🥚','enlatado':'🥫','outro':'📦'
  }
  return porCat[categoriaReceita] || '🍽️'
}

function atualizarBannerReceitas() {
  const vencendo = products
    .filter(p => { const d = daysLeft(p.expiry); return d >= 0 && d <= 7 })
    .sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry))

  const tagsEl = document.querySelector('.recipe-hero-tags')
  if (!tagsEl) return

  if (vencendo.length === 0) {
    tagsEl.innerHTML = '<span class="hero-tag">✅ Tudo em dia na sua despensa!</span>'
    return
  }

  tagsEl.innerHTML = vencendo.map(p => {
    const d = daysLeft(p.expiry)
    const emoji = EMOJIS[p.category] || '📦'
    const label = d === 0 ? 'vence hoje' : `${d} dia${d > 1 ? 's' : ''}`
    return `<span class="hero-tag">${emoji} ${p.name} — ${label}</span>`
  }).join('')
}

function abrirModalReceita(receita) {
  const modalAntigo = document.getElementById('modalReceita')
  if (modalAntigo) modalAntigo.remove()

  const modal = document.createElement('div')
  modal.id = 'modalReceita'
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.55);
    display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;backdrop-filter:blur(4px);`

  modal.innerHTML = `
    <div style="background:var(--creme,#faf6f0);border-radius:20px;max-width:580px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.2);">
      <div style="background:var(--verde-escuro,#2d4a2d);border-radius:20px 20px 0 0;padding:28px 32px 24px;color:white;position:relative;">
        <div style="font-size:48px;margin-bottom:8px;">${receita.emoji || '🍽️'}</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:24px;margin:0 0 6px;">${receita.nome}</h2>
        <p style="opacity:0.8;font-size:14px;margin:0 0 16px;">${receita.descricao || ''}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:13px;">⏱ ${receita.tempo || '?'} min</span>
          <span style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:13px;">👨‍🍳 ${receita.dificuldade || 'Fácil'}</span>
          <span style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:13px;">🏷️ ${receita.categoria}</span>
          ${receita.dieta ? `<span style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:13px;">🥗 ${receita.dieta}</span>` : ''}
        </div>
        <button onclick="document.getElementById('modalReceita').remove()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;">×</button>
      </div>
      <div style="padding:28px 32px;">
        <h3 style="font-family:'Playfair Display',serif;color:var(--verde-escuro,#2d4a2d);margin:0 0 14px;">📋 Modo de Preparo</h3>
        <ol style="padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:10px;list-style:none;">
          ${(receita.modoPreparo || []).map((passo, i) => `
            <li style="display:flex;gap:14px;align-items:flex-start;padding:12px 16px;background:white;border-radius:10px;font-size:14px;line-height:1.5;">
              <span style="background:var(--verde-escuro,#2d4a2d);color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0;margin-top:1px;">${i + 1}</span>${passo}
            </li>`).join('')}
        </ol>
        ${receita.alergenos && receita.alergenos.length ? `
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;font-size:13px;">
            ⚠️ <strong>Contém:</strong> ${receita.alergenos.join(', ')}
          </div>` : ''}
      </div>
    </div>`
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
  document.body.appendChild(modal)
}

async function loadRecipes() {
  try {
    const usuario  = JSON.parse(sessionStorage.getItem('usuario'))
    const alergias = usuario?.alergias || []
    const dietas   = usuario?.dietas   || []

    atualizarBannerReceitas()

    const vencendo = products
      .filter(p => { const d = daysLeft(p.expiry); return d >= 0 && d <= 7 })
      .sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry))

    const categorias = [...new Set(vencendo.map(p => p.category))]
    if (categorias.length === 0) { renderReceitasVazias(); return }

    const params = new URLSearchParams()
    params.append('categorias', JSON.stringify(categorias))
    if (alergias.length) params.append('alergias', JSON.stringify(alergias))
    if (dietas.length)   params.append('dietas',   JSON.stringify(dietas))

    const res  = await fetch(`${API}/receitas?${params.toString()}`)
    const data = await res.json()

    if (data.vazia || !data.receitas || data.receitas.length === 0) {
      renderReceitasVazias(); return
    }

    const lista = data.receitas.map(r => ({
      id:              r.id,
      emoji:           getEmojiReceita(r.categoriaReceita, r.nome),
      nome:            r.nome,
      descricao:       r.descricao || '',
      categoria:       r.categoria,
      categoriaReceita: r.categoriaReceita,
      dieta:           r.dieta,
      tempo:           r.tempoPreparoMin,
      dificuldade:     r.nivelDificuldade,
      tags:            [CAT_LABELS[r.categoriaReceita] || r.categoria],
      modoPreparo:     (r.modoPreparo || '').split('.').map(s => s.trim()).filter(s => s.length > 3),
      alergenos:       Array.isArray(r.alergenos) ? r.alergenos : []
    }))

    renderReceitas(lista, alergias, dietas)
  } catch (err) {
    console.error('Erro ao carregar receitas:', err)
    renderReceitasVazias()
  }
}

function renderReceitasVazias() {
  const grid = document.getElementById('recipeGrid')
  const av = document.getElementById('avisoAlergia'); if (av) av.remove()
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
      <div style="font-size:64px;margin-bottom:16px;">🎉</div>
      <h2 style="font-family:'Playfair Display',serif;color:var(--verde-escuro,#2d4a2d);margin:0 0 8px;">Missão cumprida!</h2>
      <p style="color:var(--text-mid,#666);font-size:15px;max-width:400px;margin:0 auto;">
        Nenhum produto está prestes a vencer na sua despensa. Continue assim e ajude a reduzir o desperdício! 🌱
      </p>
    </div>`
}

function renderReceitas(lista, alergias, dietas) {
  const grid = document.getElementById('recipeGrid')
  const av = document.getElementById('avisoAlergia'); if (av) av.remove()

  if (alergias.length || dietas.length) {
    const aviso = document.createElement('div')
    aviso.id = 'avisoAlergia'
    aviso.style.cssText = `background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:20px;`
    const partes = []
    if (alergias.length) partes.push(`alergias: <strong>${alergias.join(', ')}</strong>`)
    if (dietas.length)   partes.push(`dieta: <strong>${dietas.join(', ')}</strong>`)
    const partesAviso = []
      if (alergias.length) partesAviso.push(`excluindo receitas com: <strong>${alergias.join(', ')}</strong>`)
      if (dietas.length)   partesAviso.push(`priorizando dieta: <strong>${dietas.join(', ')}</strong>`)
        aviso.innerHTML = `✅ Mostrando receitas seguras para você — ${partesAviso.join(' e ')}`
    grid.parentNode.insertBefore(aviso, grid)
  }

  if (lista.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-light);">
      😔 Nenhuma receita disponível para seus produtos e restrições.</div>`
    return
  }

  grid.innerHTML = lista.map(r => `
    <div class="recipe-card">
      <div class="recipe-img">${r.emoji || '🍽️'}</div>
      <div class="recipe-body">
        <div class="recipe-title">${r.nome}</div>
        <div class="recipe-desc">${r.descricao}</div>
        <div class="recipe-tags">
          ${(r.tags || []).map(t => `<span class="recipe-tag">${t}</span>`).join('')}
          ${r.dieta ? `<span class="recipe-tag" style="background:#e8f5e9;color:#2e7d32;">🥗 ${r.dieta}</span>` : ''}
          ${r.alergenos && r.alergenos.length
            ? `<span class="recipe-tag" style="background:#fff8e1;color:#b26a00;">⚠️ ${r.alergenos.join(', ')}</span>`
            : `<span class="recipe-tag" style="background:#e8f5e9;color:#2e7d32;">✅ Sem restrições</span>`}
        </div>
        <div class="recipe-meta-row">
          ${r.tempo ? `<span>⏱ ${r.tempo} min</span>` : ''}
          <span>👨‍🍳 ${r.dificuldade || 'Fácil'}</span>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--creme-dark);">
          <button class="btn btn-primary btn-sm"
            onclick='abrirModalReceita(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
            Ver receita completa
          </button>
        </div>
      </div>
    </div>`).join('')
}

// ════════════════════════════════════════════
//  PERFIL DO USUÁRIO
// ════════════════════════════════════════════
function carregarPerfil() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  if (!usuario) return
  const footerEl = document.querySelector('.sidebar-footer')
  if (footerEl) {
    footerEl.innerHTML = `👤 ${usuario.nome}<br><small style="color:var(--verde-light)">${usuario.email}</small>
      <br><br><a href="#" onclick="sair()" style="color:var(--terra-light);font-size:12px;">Sair</a>`
  }
  carregarPreferenciasDoBackend(usuario.id)
  carregarEnderecoDoBackend(usuario.id)
}

function sair() {
  sessionStorage.removeItem('usuario')
  window.location.href = 'pages/login.html'
}

function formatCEP(input) {
  input.value = input.value.replace(/\D/g,'').replace(/(\d{5})(\d)/,'$1-$2').substring(0,9)
}

async function carregarEnderecoDoBackend(usuarioId) {
  try {
    const res = await fetch(`${API}/endereco?usuarioId=${usuarioId}`)
    if (!res.ok) return
    const lista = await res.json()
    if (!lista.length) return
    const e = lista[0]
    localStorage.setItem(`enderecoId_${usuarioId}`, e.id)
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || '' }
    set('cepInput',e.cep); set('endRua',e.rua); set('endNumero',e.numero)
    set('endBairro',e.bairro); set('endCidade',e.cidade)
    atualizarBlocoEndereco(e)
  } catch (err) { console.warn('Endereço não carregado:', err) }
}

async function carregarPreferenciasDoBackend(usuarioId) {
  try {
    const res = await fetch(`${API}/usuario/${usuarioId}`)
    if (!res.ok) return
    const usuario      = await res.json()
    const alergias     = usuario.alergias     || []
    const dietas       = usuario.dietas       || []
    const notificacoes = usuario.notificacoes || []

    document.querySelectorAll('#alergiaGroup .checkbox-item').forEach(label => {
      const texto = label.textContent.trim()
      const ativo = alergias.includes(texto)
      label.classList.toggle('checked', ativo)
      const cb = label.querySelector('input[type="checkbox"]')
      if (cb) cb.checked = ativo
    })

    document.querySelectorAll('#dietaGroup .checkbox-item').forEach(label => {
      const texto = label.textContent.trim()
      const ativo = dietas.includes(texto)
      label.classList.toggle('checked', ativo)
      const cb = label.querySelector('input[type="checkbox"]')
      if (cb) cb.checked = ativo
    })

    document.querySelectorAll('.profile-card .checkbox-group .checkbox-item').forEach(label => {
      if (label.closest('#alergiaGroup') || label.closest('#dietaGroup')) return
      const texto = label.textContent.trim()
      const ativo = notificacoes.includes(texto)
      label.classList.toggle('checked', ativo)
      const cb = label.querySelector('input[type="checkbox"]')
      if (cb) cb.checked = ativo
    })
  } catch (err) { console.warn('Preferências não carregadas:', err) }
}

function coletarDadosPerfil() {
  const alergias = []
  document.querySelectorAll('#alergiaGroup .checkbox-item').forEach(label => {
    const cb = label.querySelector('input[type="checkbox"]')
    if (cb && cb.checked) alergias.push(label.textContent.trim())
  })

  const dietas = []
  document.querySelectorAll('#dietaGroup .checkbox-item').forEach(label => {
    const cb = label.querySelector('input[type="checkbox"]')
    if (cb && cb.checked) dietas.push(label.textContent.trim())
  })

  const get = id => document.getElementById(id)?.value.trim() || ''
  const endereco = {
    cep: get('cepInput'), rua: get('endRua'), numero: get('endNumero'),
    bairro: get('endBairro'), cidade: get('endCidade'), estado: '',
  }

  const notificacoes = []
  document.querySelectorAll('.profile-card .checkbox-group .checkbox-item').forEach(label => {
    if (label.closest('#alergiaGroup') || label.closest('#dietaGroup')) return
    const cb = label.querySelector('input[type="checkbox"]')
    if (cb && cb.checked) notificacoes.push(label.textContent.trim())
  })

  return { alergias, dietas, endereco, notificacoes }
}

function atualizarBlocoEndereco(e) {
  const bloco = document.querySelector('.address-block')
  if (!bloco || (!e.rua && !e.cidade)) return
  const linha1 = [e.rua, e.numero ? `nº ${e.numero}` : '', e.bairro].filter(Boolean).join(', ')
  const linha2 = [e.cidade, e.cep ? `CEP ${e.cep}` : ''].filter(Boolean).join(' — ')
  bloco.querySelector('.address-text').innerHTML =
    `<strong>Endereço salvo</strong>${linha1}<br>${linha2}`
}

async function salvarEnderecoNoBackend(endereco, usuarioId) {
  const temDados = endereco.rua || endereco.numero || endereco.cidade || endereco.bairro || endereco.cep
  if (!temDados) return
  const enderecoId = localStorage.getItem(`enderecoId_${usuarioId}`)
  const body = { ...endereco, usuarioId }
  if (enderecoId) {
    return await fetch(`${API}/endereco/${enderecoId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
  } else {
    const res = await fetch(`${API}/endereco`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (res.ok) { const criado = await res.json(); localStorage.setItem(`enderecoId_${usuarioId}`, criado.id) }
    return res
  }
}

async function saveProfile() {
  if (!perfilEmEdicao) return
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  if (!usuario) return
  const dados = coletarDadosPerfil()
  try {
    const resUpdate = await fetch(`${API}/usuario/${usuario.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alergias: dados.alergias, dietas: dados.dietas, notificacoes: dados.notificacoes })
    })
    if (resUpdate.ok) {
      const atualizado = await resUpdate.json()
      sessionStorage.setItem('usuario', JSON.stringify({
        ...usuario,
        alergias: atualizado.alergias, dietas: atualizado.dietas, notificacoes: atualizado.notificacoes
      }))
      loadRecipes()
    } else { showToast('⚠️ Erro ao salvar preferências.'); return }
  } catch (err) { showToast('⚠️ Erro ao conectar ao servidor.'); return }
  if (dados.endereco.rua || dados.endereco.cidade) {
    try { await salvarEnderecoNoBackend(dados.endereco, usuario.id) } catch {}
  }
  atualizarBlocoEndereco(dados.endereco)
  perfilEmEdicao = false
  document.getElementById('perfilBotoes').innerHTML =
    `<button class="btn btn-secondary" onclick="editarPerfil()">✏️ Editar perfil</button>`
  const aviso = document.getElementById('perfilLeituraAviso')
  aviso.style.background = 'var(--creme-dark,#f1ede6)'
  aviso.style.borderColor = 'var(--verde,#5a7a5a)'
  aviso.innerHTML = `🔒 <span>Perfil em modo de visualização. Clique em <strong>Editar perfil</strong> para fazer alterações.</span>`
  travaEdicao()
  showToast('✅ Perfil salvo com sucesso!')
}

function mostrarResumoPerfil(dados) {
  const secao = document.getElementById('usuario')
  let resumo  = secao.querySelector('.perfil-resumo')
  if (!resumo) {
    resumo = document.createElement('div')
    resumo.className = 'perfil-resumo'
    resumo.style.cssText = 'background:var(--creme-dark,#f1ede6);border:1.5px solid var(--verde,#5a7a5a);border-radius:12px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:var(--text-dark,#333);line-height:1.8'
    secao.querySelector('.section-header').insertAdjacentElement('afterend', resumo)
  }
  const fmt = (arr, vazio) => arr.length ? arr.join(' · ') : `<em style="color:#999">${vazio}</em>`
  const endStr = dados.endereco.rua
    ? [dados.endereco.rua, dados.endereco.numero, dados.endereco.cidade].filter(Boolean).join(', ')
    : null
  resumo.innerHTML = `
    <strong>✅ Perfil atualizado com sucesso!</strong><br>
    🤧 <strong>Alergias:</strong> ${fmt(dados.alergias, 'Nenhuma informada')}<br>
    🥗 <strong>Dietas:</strong> ${fmt(dados.dietas, 'Nenhuma selecionada')}<br>
    📍 <strong>Endereço:</strong> ${endStr ?? '<em style="color:#999">Não informado</em>'}<br>
    🔔 <strong>Notificações:</strong> ${fmt(dados.notificacoes, 'Nenhuma ativa')}`
}

// ════════════════════════════════════════════
//  PONTOS DE DESCARTE
// ════════════════════════════════════════════
// ══════════════════════════════════════════
// SUBSTITUI as funções loadDescarte e
// renderDescarteFallback no script.js
// ══════════════════════════════════════════

// ════════════════════════════════════════════
// FUNÇÕES DE DESTINAR — cole no script.js
// substituindo loadDescarte e renderDescarteFallback
// ════════════════════════════════════════════

// Aba ativa: 'descarte' ou 'doacao'
let abaAtiva = 'descarte'

function switchTab(aba) {
  abaAtiva = aba

  // Estilo dos botões
  const btnDesc = document.getElementById('tabDescarte')
  const btnDoac = document.getElementById('tabDoacao')
  if (btnDesc && btnDoac) {
    btnDesc.className = aba === 'descarte' ? 'btn btn-primary' : 'btn btn-secondary'
    btnDoac.className = aba === 'doacao'   ? 'btn btn-primary' : 'btn btn-secondary'
    btnDesc.style.borderRadius = '30px'; btnDesc.style.padding = '10px 24px'
    btnDoac.style.borderRadius = '30px'; btnDoac.style.padding = '10px 24px'
  }

  loadDescarte()
}

// ── Pega cidade do usuário salva no perfil ──
async function getCidadeUsuario() {
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  if (!usuario?.id) return null
  try {
    const res = await fetch(`${API}/endereco?usuarioId=${usuario.id}`)
    if (!res.ok) return null
    const enderecos = await res.json()
    return enderecos[0]?.cidade || null
  } catch { return null }
}

// ── Normaliza string para comparação ──
function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
}

// ── Abre Maps com busca na cidade ──
function abrirMapaGeral() {
  getCidadeUsuario().then(cidade => {
    const termo = abaAtiva === 'doacao'
      ? `banco de alimentos doacao ${cidade || 'Campinas'} SP`
      : `ecopontos descarte ${cidade || 'Campinas'} SP`
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(termo)}`, '_blank')
  })
}

// ── Renderiza mensagem de endereço não cadastrado ──
function renderSemEndereco() {
  document.getElementById('descarteList').innerHTML = `
    <div style="text-align:center;padding:60px 20px;background:white;border-radius:16px;border:2px dashed var(--verde,#5a7a5a);">
      <div style="font-size:48px;margin-bottom:16px;">📍</div>
      <h3 style="font-family:'Playfair Display',serif;color:var(--verde-escuro,#2d4a2d);margin:0 0 8px;">
        Complete seu perfil!
      </h3>
      <p style="color:var(--text-mid,#666);font-size:14px;max-width:300px;margin:0 auto 20px;">
        Adicione seu endereço no perfil para ver os pontos mais próximos de você.
      </p>
      <button class="btn btn-primary"
        onclick="navigate('usuario', document.querySelector('[data-section=usuario] a'))">
        📝 Ir para Meu Perfil
      </button>
    </div>`
}

// ── Renderiza lista de locais ──
// ════════════════════════════════════════════
// Card de medicamentos — adiciona ao final
// da função renderLocais quando aba = descarte
// ════════════════════════════════════════════

// Substitui a função renderLocais existente por essa versão:
// Substitui a função renderLocais inteira no script.js

function renderLocais(lista, cidade, tipo) {
  const aviso = lista.length > 0
    ? `<div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:20px;">
        ${tipo === 'doacao' ? '🤝' : '♻️'} Mostrando <strong>${lista.length}</strong>
        ${tipo === 'doacao' ? 'locais de doação' : 'pontos de descarte'}
        em <strong>${cidade}</strong>
       </div>`
    : `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:20px;">
        ⚠️ Não encontramos locais em <strong>${cidade}</strong>. Mostrando todos disponíveis.
       </div>`

  const cards = lista.map(d => {
    const endQ = d.endereco
      ? `${d.endereco.rua}, ${d.endereco.numero}, ${d.endereco.cidade}, ${d.endereco.estado}`
      : d.nome
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endQ)}`

    const nomeLower = d.nome.toLowerCase()
    let icon = tipo === 'doacao' ? '🤝' : '🏭'
    if (nomeLower.includes('banco')) icon = tipo === 'doacao' ? '🏦' : '🌿'
    else if (nomeLower.includes('ong') || nomeLower.includes('instituto')) icon = '💚'
    else if (nomeLower.includes('cooperativa')) icon = '♻️'
    else if (nomeLower.includes('pastoral') || nomeLower.includes('caritas') || nomeLower.includes('fraternidade')) icon = '✝️'
    else if (nomeLower.includes('sesc') || nomeLower.includes('mesa')) icon = '🍽️'

    return `
      <div class="descarte-card">
        <div class="descarte-icon">${icon}</div>
        <div class="descarte-body">
          <div class="descarte-name">${d.nome}</div>
          ${d.endereco ? `
            <div class="descarte-address">
              📍 ${d.endereco.rua}, ${d.endereco.numero}
              ${d.endereco.bairro ? `— ${d.endereco.bairro}` : ''}
              — ${d.endereco.cidade}/${d.endereco.estado}
            </div>` : ''}
          <div class="descarte-tags">
            ${(d.tipoProduto || '').split(',').map(t => t.trim())
              .filter(t => t).map(t => `<span class="descarte-tag">${t}</span>`).join('')}
          </div>
          ${d.horarioFuncionamento ? `
            <p style="font-size:12px;color:var(--text-mid);margin:8px 0;line-height:1.5;">
              🕐 ${d.horarioFuncionamento}
            </p>` : ''}
          ${d.instrucoes ? `
            <p style="font-size:12px;color:var(--text-mid);margin:8px 0;line-height:1.5;">
              ℹ️ ${d.instrucoes}
            </p>` : ''}
          ${d.telefone ? `
            <p style="font-size:12px;color:var(--text-mid);margin:4px 0;">
              📞 ${d.telefone}
            </p>` : ''}
          ${d.restricoes ? `
            <p style="font-size:11px;color:#c62828;margin:4px 0;">
              ⛔ ${d.restricoes}
            </p>` : ''}
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:12px;">
            <a href="${mapsUrl}" target="_blank" rel="noopener" style="margin-left:auto;text-decoration:none;">
              <button class="btn btn-secondary btn-sm">🗺️ Ver no Maps</button>
            </a>
          </div>
        </div>
      </div>`
  }).join('')

  // Card medicamentos — só na aba descarte
  const cardMedicamentos = tipo === 'descarte' ? `
    <div style="
      margin-top:32px;
      background:var(--creme,#faf6f0);
      border:1.5px solid var(--verde,#5a7a5a);
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 4px 20px rgba(45,74,45,0.08);
    ">
      <div style="
        background:var(--verde-escuro,#2d4a2d);
        padding:20px 24px;
        display:flex;
        align-items:center;
        gap:16px;
      ">
        <div style="font-size:36px;">💊</div>
        <div>
          <div style="
            color:white;
            font-family:'Playfair Display',serif;
            font-size:18px;
            font-weight:700;
            margin-bottom:2px;
          ">Descarte de Medicamentos</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;">
            Saiba como descartar remédios vencidos de forma segura
          </div>
        </div>
      </div>

      <div style="padding:20px 24px;">
        <div style="
          display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;
          background:#f1ede6;border-radius:10px;padding:14px;
        ">
          <span style="font-size:20px;flex-shrink:0;">⚠️</span>
          <p style="margin:0;font-size:13px;color:var(--text-dark,#333);line-height:1.6;">
            Medicamentos vencidos <strong>não devem ser jogados no lixo comum</strong>
            nem descartados no esgoto — eles contaminam o solo e os recursos hídricos.
          </p>
        </div>

        <div style="
          background:white;border-radius:12px;padding:16px;
          margin-bottom:16px;border-left:4px solid var(--verde,#5a7a5a);
        ">
          <div style="
            font-size:13px;font-weight:600;
            color:var(--verde-escuro,#2d4a2d);margin-bottom:10px;
          ">✅ Como descartar corretamente:</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#333;">
              <span style="color:var(--verde,#5a7a5a);font-weight:bold;flex-shrink:0;">1.</span>
              Leve os medicamentos à <strong>farmácia mais próxima</strong> — todas são obrigadas por lei (RDC 222/2018)
            </div>
            <div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#333;">
              <span style="color:var(--verde,#5a7a5a);font-weight:bold;flex-shrink:0;">2.</span>
              Mantenha os remédios na <strong>embalagem original</strong> com a bula quando possível
            </div>
            <div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#333;">
              <span style="color:var(--verde,#5a7a5a);font-weight:bold;flex-shrink:0;">3.</span>
              Não misture diferentes tipos de medicamentos em um único pacote
            </div>
            <div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#333;">
              <span style="color:var(--verde,#5a7a5a);font-weight:bold;flex-shrink:0;">4.</span>
              O serviço é <strong>gratuito</strong> e sem necessidade de apresentar receita
            </div>
          </div>
        </div>

        <div style="
          display:flex;gap:10px;flex-wrap:wrap;
          align-items:center;justify-content:space-between;
        ">
          <div style="font-size:12px;color:var(--text-mid,#666);">
            📍 Encontre a farmácia mais próxima:
          </div>
          <a href="https://www.google.com/maps/search/${encodeURIComponent(`farmacia descarte medicamentos ${cidade} SP`)}"
            target="_blank" rel="noopener" style="text-decoration:none;">
            <button class="btn btn-primary btn-sm" style="border-radius:25px;padding:10px 20px;">
              🗺️ Ver farmácias no Maps
            </button>
          </a>
        </div>
      </div>
    </div>
  ` : ''

  document.getElementById('descarteList').innerHTML = aviso + cards + cardMedicamentos
}
// ── Carrega descarte ou doação conforme aba ativa ──
async function loadDescarte() {
  const cidade = await getCidadeUsuario()

  if (!cidade) { renderSemEndereco(); return }

  try {
    if (abaAtiva === 'descarte') {
      const res    = await fetch(`${API}/despejo`)
      const locais = await res.json()
      if (!locais || locais.length === 0) { renderDescarteFallback(); return }

      const filtrados = locais.filter(d => norm(d.endereco?.cidade) === norm(cidade))
      const lista = filtrados.length > 0 ? filtrados : locais
      renderLocais(lista, cidade, 'descarte')

    } else {
      const res    = await fetch(`${API}/doacao`)
      const locais = await res.json()
      if (!locais || locais.length === 0) {
        document.getElementById('descarteList').innerHTML = `
          <div style="text-align:center;padding:48px;color:var(--text-light);">
            😔 Nenhum local de doação cadastrado ainda.
          </div>`
        return
      }

      const filtrados = locais.filter(d => norm(d.endereco?.cidade) === norm(cidade))
      const lista = filtrados.length > 0 ? filtrados : locais
      renderLocais(lista, cidade, 'doacao')
    }
  } catch (err) {
    console.error('Erro ao carregar:', err)
    renderDescarteFallback()
  }
}

function renderDescarteFallback() {
  const points = [
    { icon:'🏭', name:'Ecoponto Barão Geraldo',
      address:'Av. Santa Isabel, 2300 — Barão Geraldo, Campinas/SP',
      tags:['Recicláveis','Entulho','Móveis'],
      horario:'Todos os dias, das 7h às 19h',
      maps:'Av. Santa Isabel, 2300, Barão Geraldo, Campinas, SP' },
    { icon:'🌿', name:'Banco Municipal de Alimentos — CEASA',
      address:'Rod. Dom Pedro I, km 140,5 — Campinas/SP',
      tags:['Alimentos perecíveis','Frutas','Verduras'],
      horario:'Segunda a sexta, das 7h às 17h',
      maps:'CEASA Campinas, Campinas, SP' },
  ]
  document.getElementById('descarteList').innerHTML = points.map(d => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.maps)}`
    return `
      <div class="descarte-card">
        <div class="descarte-icon">${d.icon}</div>
        <div class="descarte-body">
          <div class="descarte-name">${d.name}</div>
          <div class="descarte-address">📍 ${d.address}</div>
          <div class="descarte-tags">${d.tags.map(t=>`<span class="descarte-tag">${t}</span>`).join('')}</div>
          <p style="font-size:12px;color:var(--text-mid);margin:8px 0;">🕐 ${d.horario}</p>
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:12px;">
            <a href="${mapsUrl}" target="_blank" rel="noopener" style="margin-left:auto;text-decoration:none;">
              <button class="btn btn-secondary btn-sm">🗺️ Ver no Maps</button>
            </a>
          </div>
        </div>  
      </div>`
  }).join('')
}

function abrirMapaGeral() {
  getCidadeUsuario().then(cidade => {
    const cidadeStr = cidade || 'Campinas'
    const termo = abaAtiva === 'doacao'
      ? `banco de alimentos doacao alimentos ${cidadeStr} SP`
      : `ecopontos descarte ${cidadeStr} SP`
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(termo)}`, '_blank')
  })
}






// ════════════════════════════════════════════
//  EDIÇÃO DO PERFIL
// ════════════════════════════════════════════
let perfilEmEdicao = false

function editarPerfil() {
  perfilEmEdicao = true
  document.getElementById('perfilBotoes').innerHTML = `
    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary" onclick="cancelarEdicao()">✖ Cancelar</button>
      <button class="btn btn-primary" onclick="saveProfile()">💾 Salvar alterações</button>
    </div>`
  const aviso = document.getElementById('perfilLeituraAviso')
  aviso.style.background = '#e8f5e9'
  aviso.style.borderColor = '#a5d6a7'
  aviso.innerHTML = `✏️ <span>Modo de edição ativo. Faça suas alterações e clique em <strong>Salvar alterações</strong>.</span>`
  document.querySelectorAll('#usuario input, #usuario select, #usuario textarea').forEach(el => {
    el.disabled = false; el.style.opacity = '1'; el.style.cursor = 'auto'
  })
  document.querySelectorAll('#usuario .checkbox-item').forEach(label => {
    label.style.opacity = '1'; label.style.cursor = 'pointer'
  })
}

function cancelarEdicao() {
  perfilEmEdicao = false
  document.getElementById('perfilBotoes').innerHTML =
    `<button class="btn btn-secondary" onclick="editarPerfil()">✏️ Editar perfil</button>`
  const aviso = document.getElementById('perfilLeituraAviso')
  aviso.style.background = 'var(--creme-dark,#f1ede6)'
  aviso.style.borderColor = 'var(--verde,#5a7a5a)'
  aviso.innerHTML = `🔒 <span>Perfil em modo de visualização. Clique em <strong>Editar perfil</strong> para fazer alterações.</span>`
  const usuario = JSON.parse(sessionStorage.getItem('usuario'))
  if (usuario) carregarPreferenciasDoBackend(usuario.id)
  travaEdicao()
}

function travaEdicao() {
  document.querySelectorAll('#usuario input, #usuario select, #usuario textarea').forEach(el => {
    el.disabled = true; el.style.opacity = '0.75'; el.style.cursor = 'default'
  })
  document.querySelectorAll('#usuario .checkbox-item').forEach(label => {
    label.style.opacity = '0.75'; label.style.cursor = 'default'
  })
}



// ════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg; t.style.transform = 'translateY(0)'; t.style.opacity = '1'
  setTimeout(() => { t.style.transform = 'translateY(80px)'; t.style.opacity = '0' }, 3000)
}

// ════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  carregarPerfil()
  loadProducts().then(() => loadRecipes())
  loadDescarte()
  setTimeout(() => travaEdicao(), 600)
})