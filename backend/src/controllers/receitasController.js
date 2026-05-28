const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listar(req, res) {
  try {
    const { alergias, categorias, dietas } = req.query

    let alergiasArr = []
    if (alergias) {
      try { alergiasArr = JSON.parse(alergias) }
      catch { alergiasArr = alergias.split(',').map(a => a.trim()) }
    }

    let categoriasArr = []
    if (categorias) {
      try { categoriasArr = JSON.parse(categorias) }
      catch { categoriasArr = categorias.split(',').map(c => c.trim()) }
    }

    let dietasArr = []
    if (dietas) {
      try { dietasArr = JSON.parse(dietas) }
      catch { dietasArr = dietas.split(',').map(d => d.trim()) }
    }

    if (categoriasArr.length === 0) {
      return res.json({ vazia: true, receitas: [] })
    }

    // Busca receitas pela categoria dos produtos vencendo
    const todasReceitas = await prisma.receitas.findMany({
      where: { categoriaReceita: { in: categoriasArr } }
    })

    // Filtra alergias — exclui receitas que contêm alergênios do usuário
    let filtradas = todasReceitas
    if (alergiasArr.length > 0) {
      filtradas = filtradas.filter(r => {
        const alergenos = Array.isArray(r.alergenos) ? r.alergenos : []
        // Exclui se qualquer alergeno da receita bater com as alergias do usuário
        return !alergenos.some(a =>
          alergiasArr.some(ua => 
            ua.toLowerCase().trim() === a.toLowerCase().trim()
          )
        )
      })
    }

    // Ordena: 1º receitas que batem com a dieta do usuário, 2º as sem dieta definida
    filtradas.sort((a, b) => {
      // Primeiro ordena por urgência da categoria
      const idxA = categoriasArr.indexOf(a.categoriaReceita)
      const idxB = categoriasArr.indexOf(b.categoriaReceita)
      if (idxA !== idxB) return idxA - idxB

      // Dentro da mesma categoria, prioriza receitas com dieta do usuário
      if (dietasArr.length > 0) {
        const aTemDieta = dietasArr.some(d => 
          d.toLowerCase().trim() === (a.dieta || '').toLowerCase().trim()
        )
        const bTemDieta = dietasArr.some(d => 
          d.toLowerCase().trim() === (b.dieta || '').toLowerCase().trim()
        )
        if (aTemDieta && !bTemDieta) return -1
        if (!aTemDieta && bTemDieta) return 1
      }
      return 0
    })

    res.json({ vazia: false, receitas: filtradas })
  } catch (error) {
    console.error('Erro ao listar receitas:', error)
    res.status(500).json({ error: 'Erro ao listar receitas' })
  }
}

async function detalhe(req, res) {
  try {
    const receita = await prisma.receitas.findUnique({
      where: { id: Number(req.params.id) }
    })
    if (!receita) return res.status(404).json({ error: 'Receita não encontrada' })
    res.json(receita)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter detalhes da receita' })
  }
}

async function criar(req, res) {
  try {
    const { nome, categoria, descricao, modoPreparo, nivelDificuldade,
            tempoPreparoMin, itemId, alergenos, categoriaReceita, dieta } = req.body
    const receita = await prisma.receitas.create({
      data: {
        nome, categoria, descricao, modoPreparo, nivelDificuldade,
        tempoPreparoMin, alergenos: alergenos || [],
        categoriaReceita, dieta,
        ...(itemId ? { item: { connect: { id: itemId } } } : {})
      }
    })
    res.status(201).json(receita)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar receita' })
  }
}

async function atualizar(req, res) {
  try {
    const receita = await prisma.receitas.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(receita)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar receita' })
  }
}

async function remover(req, res) {
  try {
    await prisma.receitas.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Receita removida com sucesso' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover receita' })
  }
}

module.exports = { listar, detalhe, criar, atualizar, remover }