const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listar(req, res) {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                dataCadastro: true,
                alergias: true,
                dietas: true,
                notificacoes: true
            }
        });
        
        // Prisma já retorna JSON como arrays/objetos, apenas garantir que são arrays
        const usuariosFormatados = usuarios.map(u => ({
            ...u,
            alergias: Array.isArray(u.alergias) ? u.alergias : [],
            dietas: Array.isArray(u.dietas) ? u.dietas : [],
            notificacoes: Array.isArray(u.notificacoes) ? u.notificacoes : []
        }));
        
        res.json(usuariosFormatados);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
}

async function detalhe(req, res) {
    try {
        const usuarioId = Number(req.params.id);
        console.log('🔵 GET usuário:', usuarioId);
        
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { id: true, nome: true, email: true, dataCadastro: true, alergias: true, dietas: true, notificacoes: true }
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        console.log('📥 Dados retornados do DB:', {
            alergias: usuario.alergias,
            dietas: usuario.dietas,
            notificacoes: usuario.notificacoes
        });
        
        // Prisma já retorna JSON como arrays/objetos
        res.json({
            ...usuario,
            alergias: Array.isArray(usuario.alergias) ? usuario.alergias : [],
            dietas: Array.isArray(usuario.dietas) ? usuario.dietas : [],
            notificacoes: Array.isArray(usuario.notificacoes) ? usuario.notificacoes : []
        });
    } catch (error) {
        console.error('Erro ao detalhar usuário:', error);
        res.status(500).json({ error: 'Erro ao detalhar usuário' });
    }
}

async function criar(req, res) {
    try {
        const { nome, email, senha } = req.body;
        const usuario = await prisma.usuario.create({
            data: { nome, email, senha }
        });
        res.status(201).json({ 
            id: usuario.id, 
            nome: usuario.nome, 
            email: usuario.email,
            alergias: [],
            dietas: [],
            notificacoes: []
        });
    } catch (error) {
        if (error.code === 'P2002' && error.meta && error.meta.target.includes('email')) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
}

async function atualizar(req, res) {
    try {
        const usuarioData = req.body;
        
        console.log('🔵 UPDATE usuário:', req.params.id);
        console.log('📤 Dados recebidos:', JSON.stringify(usuarioData));

        const usuario = await prisma.usuario.update({
            where: { id: Number(req.params.id) },
            data: usuarioData
        });
        
        console.log('✅ Usuário atualizado:', usuario.id);
        console.log('📥 Dados salvos no DB:', {
            alergias: usuario.alergias,
            dietas: usuario.dietas,
            notificacoes: usuario.notificacoes
        });
        
        // Retorna com arrays garantidos
        res.json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            alergias: Array.isArray(usuario.alergias) ? usuario.alergias : [],
            dietas: Array.isArray(usuario.dietas) ? usuario.dietas : [],
            notificacoes: Array.isArray(usuario.notificacoes) ? usuario.notificacoes : []
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        // Tratar erro de constraint unique (email duplicado)
        if (error.code === 'P2002' && error.meta && error.meta.target && error.meta.target.includes('email')) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
}

async function remover(req, res) {
    try {
        await prisma.usuario.delete({
            where: { id: Number(req.params.id) }
        });
        res.json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover usuário:', error);
        res.status(500).json({ error: 'Erro ao remover usuário' });
    }
}

module.exports = {
    listar,
    detalhe,
    criar,
    atualizar,
    remover
}
