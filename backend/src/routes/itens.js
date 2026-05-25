const router = require('express').Router();
const c = require('../controllers/itensController');

router.get('/', c.listar)
router.get('/alertas/:usuarioId', c.alertas)
router.get('/:id', c.detalhe)
router.post('/', c.criar)
router.patch('/:id', c.atualizar)
router.delete('/:id', c.remover)

module.exports = router;