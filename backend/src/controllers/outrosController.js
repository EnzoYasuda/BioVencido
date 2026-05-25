const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════
//  UTILITÁRIO: distância em km entre dois pontos (Haversine)
// ═══════════════════════════════════════════════════════
function haversineKm(lat1, lng1, lat2, lng2) {
  const R   = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ═══════════════════════════════════════════════════════
//  UTILITÁRIO: geocodifica um endereço via Nominatim (OpenStreetMap)
//  Retorna { lat, lng } ou null
//  Chamado automaticamente ao criar/atualizar local sem coords
// ═══════════════════════════════════════════════════════
async function geocodificar(rua, numero, cidade, estado) {
  try {
    const query = [rua, numero, cidade, estado].filter(Boolean).join(', ')
    const url   = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    const res   = await fetch(url, {
      headers: { 'User-Agent': 'BioVencido/1.0 (contato@biovencido.com)' }
    })
    const data  = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch (err) {
    console.warn('⚠️ Geocodificação falhou:', err.message)
    return null
  }
}

// ═══════════════════════════════════════════════════════
//  ENDEREÇOS
// ═══════════════════════════════════════════════════════

async function listarEnderecos(req, res) {
  try {
    const { usuarioId } = req.query
    const enderecos = await prisma.endereco.findMany({
      where: usuarioId ? { usuarioId: Number(usuarioId) } : {}
    })
    res.json(enderecos)
  } catch (error) {
    console.error('Erro ao listar endereços:', error)
    res.status(500).json({ error: 'Erro ao listar endereços' })
  }
}

async function criarEndereco(req, res) {
  try {
    console.log('📤 Criando endereço com dados:', req.body)
    const endereco = await prisma.endereco.create({ data: req.body })
    console.log('✅ Endereço criado:', endereco.id)
    res.status(201).json(endereco)
  } catch (error) {
    console.error('❌ Erro ao criar endereço:', error)
    res.status(500).json({ error: 'Erro ao criar endereço: ' + error.message })
  }
}

async function atualizarEndereco(req, res) {
  try {
    console.log('📤 Atualizando endereço', req.params.id, 'com dados:', req.body)
    const endereco = await prisma.endereco.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    console.log('✅ Endereço atualizado:', endereco.id)
    res.json(endereco)
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error)
    res.status(500).json({ error: 'Erro ao atualizar endereço: ' + error.message })
  }
}

async function removerEndereco(req, res) {
  try {
    await prisma.endereco.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Endereço removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover endereço:', error)
    res.status(500).json({ error: 'Erro ao remover endereço' })
  }
}

// ═══════════════════════════════════════════════════════
//  LOCAIS DE DESPEJO
// ═══════════════════════════════════════════════════════

async function listarDespejo(req, res) {
  try {
    const { tipoProduto, lat, lng, raioKm } = req.query

    const locais = await prisma.localDespejo.findMany({
      where: tipoProduto ? { tipoProduto } : {},
      include: { endereco: true }
    })

    // Calcula distância se o frontend enviou coords do usuário
    let resultado = locais.map(l => {
      const distancia =
        lat && lng && l.lat && l.lng
          ? haversineKm(parseFloat(lat), parseFloat(lng), l.lat, l.lng)
          : null
      return { ...l, distanciaKm: distancia ? +distancia.toFixed(2) : null }
    })

    // Filtra por raio se informado
    if (lat && lng && raioKm) {
      resultado = resultado.filter(
        l => l.distanciaKm === null || l.distanciaKm <= parseFloat(raioKm)
      )
    }

    // Ordena: com distância primeiro (mais próximos), depois sem coords
    resultado.sort((a, b) => {
      if (a.distanciaKm === null) return 1
      if (b.distanciaKm === null) return -1
      return a.distanciaKm - b.distanciaKm
    })

    res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar locais de despejo:', error)
    res.status(500).json({ error: 'Erro ao listar locais de despejo' })
  }
}

async function criarDespejo(req, res) {
  try {
    let { lat, lng, enderecoId, ...rest } = req.body

    // Geocodifica automaticamente se não veio lat/lng mas tem endereçoId
    if ((!lat || !lng) && enderecoId) {
      const end = await prisma.endereco.findUnique({ where: { id: Number(enderecoId) } })
      if (end) {
        const coords = await geocodificar(end.rua, end.numero, end.cidade, end.estado)
        if (coords) { lat = coords.lat; lng = coords.lng }
      }
    }

    const local = await prisma.localDespejo.create({
      data: { ...rest, enderecoId: enderecoId ? Number(enderecoId) : undefined, lat, lng }
    })
    res.status(201).json(local)
  } catch (error) {
    console.error('Erro ao criar local de despejo:', error)
    res.status(500).json({ error: 'Erro ao criar local de despejo' })
  }
}

// ═══════════════════════════════════════════════════════
//  LOCAIS DE DOAÇÃO
// ═══════════════════════════════════════════════════════

async function listarDoacao(req, res) {
  try {
    const { tipoProduto, lat, lng, raioKm } = req.query

    const locais = await prisma.localDoacao.findMany({
      where: tipoProduto ? { tipoProduto } : {},
      include: { endereco: true }
    })

    let resultado = locais.map(l => {
      const distancia =
        lat && lng && l.lat && l.lng
          ? haversineKm(parseFloat(lat), parseFloat(lng), l.lat, l.lng)
          : null
      return { ...l, distanciaKm: distancia ? +distancia.toFixed(2) : null }
    })

    if (lat && lng && raioKm) {
      resultado = resultado.filter(
        l => l.distanciaKm === null || l.distanciaKm <= parseFloat(raioKm)
      )
    }

    resultado.sort((a, b) => {
      if (a.distanciaKm === null) return 1
      if (b.distanciaKm === null) return -1
      return a.distanciaKm - b.distanciaKm
    })

    res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar locais de doação:', error)
    res.status(500).json({ error: 'Erro ao listar locais de doação' })
  }
}

async function criarDoacao(req, res) {
  try {
    let { lat, lng, enderecoId, ...rest } = req.body

    if ((!lat || !lng) && enderecoId) {
      const end = await prisma.endereco.findUnique({ where: { id: Number(enderecoId) } })
      if (end) {
        const coords = await geocodificar(end.rua, end.numero, end.cidade, end.estado)
        if (coords) { lat = coords.lat; lng = coords.lng }
      }
    }

    const local = await prisma.localDoacao.create({
      data: { ...rest, enderecoId: enderecoId ? Number(enderecoId) : undefined, lat, lng }
    })
    res.status(201).json(local)
  } catch (error) {
    console.error('Erro ao criar local de doação:', error)
    res.status(500).json({ error: 'Erro ao criar local de doação' })
  }
}

// ═══════════════════════════════════════════════════════
//  DOAÇÕES (registros de doação de itens)
// ═══════════════════════════════════════════════════════

async function listarDoacoes(req, res) {
  try {
    const { usuarioId } = req.query
    const doacoes = await prisma.doacao.findMany({
      where: usuarioId ? { usuarioId: Number(usuarioId) } : {},
      include: { localDoacao: true, item: true }
    })
    res.json(doacoes)
  } catch (error) {
    console.error('Erro ao listar doações:', error)
    res.status(500).json({ error: 'Erro ao listar doações' })
  }
}

async function criarDoacaoItem(req, res) {
  try {
    const doacao = await prisma.doacao.create({ data: req.body })
    res.status(201).json(doacao)
  } catch (error) {
    console.error('Erro ao criar doação:', error)
    res.status(500).json({ error: 'Erro ao criar doação' })
  }
}

module.exports = {
  listarEnderecos,
  criarEndereco,
  atualizarEndereco,
  removerEndereco,
  listarDespejo,
  criarDespejo,
  listarDoacao,
  criarDoacao,
  listarDoacoes,
  criarDoacaoItem
}