const router = require('express').Router();
const c = require('../controllers/outrosController');

router.get('/', c.listarEnderecos)
router.post('/', c.criarEndereco)
router.patch('/:id', c.atualizarEndereco)
router.delete('/:id', c.removerEndereco)

module.exports = router;