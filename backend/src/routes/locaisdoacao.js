const router = require('express').Router();
const c = require('../controllers/outrosController');

router.get('/', c.listarDoacao)
router.post('/', c.criarDoacao)

module.exports = router;