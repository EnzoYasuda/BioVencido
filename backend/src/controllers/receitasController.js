const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listar(req, res) {
    try {
        const { itemId, categoria } = req.query
        const receitas = await prisma.receitas.findMany({
            where: {
                ...(itemId ? { itensPereciveis: { has: Number(itemId) } } : {}),
                ...(categoria ? { categoria: categoria } : {})
            },
            include: { item: true }
        })
        res.json(receitas);
    } catch (error) {
        console.error('Erro ao listar receitas:', error);
        res.status(500).json({ error: 'Erro ao listar receitas' });
    }
}

async function detalhe(req, res) {
    try {
        const receita = await prisma.receitas.findUnique({
            where: { id: Number(req.params.id) },
            include: { item: true }
        })
        if (!receita) {
            return res.status(404).json({ error: 'Receita não encontrada' });
        }
        res.json(receita);
    } catch (error) {
        console.error('Erro ao obter detalhes da receita:', error);
        res.status(500).json({ error: 'Erro ao obter detalhes da receita' });
    }
}

async function criar(req, res) {
    try {
        const { nome, categoria, modoPreparo, nivelDificuldade, tempoPreparoMin, itemId } = req.body
        const receita = await prisma.receitas.create({
            data: {
                nome,
                categoria,
                modoPreparo,
                nivelDificuldade,
                tempoPreparoMin,
                item: { connect: { id: itemId } }
            }
        })
        res.status(201).json(receita);
    } catch (error) {
        console.error('Erro ao criar receita:', error);
        res.status(500).json({ error: 'Erro ao criar receita' });
    }
}

async function atualizar(req, res) {
    try {
        const receita = await prisma.receitas.update({
            where: { id: Number(req.params.id) },
            data: req.body
        })
        res.json(receita);
    } catch (error) {
        console.error('Erro ao atualizar receita:', error);
        res.status(500).json({ error: 'Erro ao atualizar receita' });
    }
}

async function remover(req, res) {
    try {
        await prisma.receitas.delete({
            where: { id: Number(req.params.id) }
        })
        res.json({ message: 'Receita removida com sucesso' });
    } catch (error) {
        console.error('Erro ao remover receita:', error);
        res.status(500).json({ error: 'Erro ao remover receita' });
    }
}

module.exports = {
    listar,
    detalhe,
    criar,
    atualizar,
    remover
}