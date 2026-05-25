const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function calcularStatus(dataValidade) {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasrestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    let status;
    if (diasrestantes < 0) {
        status = 'Vencido';
    } else if (diasrestantes <= 3) {
        status = 'Vence em breve';
    } else if (diasrestantes <= 7) {
        status = 'Próximo do vencimento';
    } else {
        status = 'Válido';
    }

    return { status, diasrestantes };
}

async function listar(req, res) {
    try {
        const { usuarioId } = req.query;
        const itens = await prisma.itensPereciveis.findMany({
            where: usuarioId ? { usuarioId: Number(usuarioId) } : {},
            include: { receitas: true }
        })

        const itensComStatus = itens.map(item => ({
            ...item,
            ...calcularStatus(item.dataValidade)
        }))

        res.json(itensComStatus);
    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({ error: 'Erro ao listar itens' });
    }
}

async function detalhe(req, res) {
    try {
        const item = await prisma.itensPereciveis.findUnique({
            where: { id: Number(req.params.id) },
            include: { receitas: true, usuario: { select: { nome: true }} }
        })

        if (!item) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }

        res.json({
            ...item,
            ...calcularStatus(item.dataValidade)
        });
    } catch (error) {
        console.error('Erro ao obter detalhes do item:', error);
        res.status(500).json({ error: 'Erro ao obter detalhes do item' });
    }
}

async function criar(req, res) {
    try {
        const { nome, categoria, dataCompra, dataUso, dataValidade, quantidade, usuarioId, observacoes } = req.body
        const itemAtualizado = await prisma.itensPereciveis.create({
            data: {
                nome,
                categoria,
                dataCompra: new Date(dataCompra),
                dataUso: dataUso ? new Date(dataUso) : null,
                dataValidade: new Date(dataValidade),
                quantidade,
                usuarioId,
                observacoes
            }
        })

        res.status(201).json(itemAtualizado);
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({ error: 'Erro ao criar item' });
    }
}

async function atualizar(req, res) {
    try {
        const item = await prisma.itensPereciveis.update({
            where: { id: Number(req.params.id) },
            data: req.body
        })

        res.json(item);
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ error: 'Erro ao atualizar item' });
    }
}

async function remover(req, res) {
    try {
        await prisma.itensPereciveis.delete({
            where: { id: Number(req.params.id) }
        })

        res.json({ message: 'Item removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover item:', error);
        res.status(500).json({ error: 'Erro ao remover item' });
    }
}

async function alertas(req, res) {
    try {
        const itens = await prisma.itensPereciveis.findMany({
            where: {
                usuarioId: Number(req.query.usuarioId),
                terminado: false
            }
        })

        const alertas = itens.map(item => ({
            ...item,
            ...calcularStatus(item.dataValidade)
        })).filter(item => item.status !== 'Válido')

        res.json(alertas);
    } catch (error) {
        console.error('Erro ao listar alertas:', error);
        res.status(500).json({ error: 'Erro ao listar alertas' });
    }
}

module.exports = {
    listar,
    detalhe,
    criar,
    atualizar,
    remover,
    alertas
}