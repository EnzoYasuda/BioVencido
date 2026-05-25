const router = require('express').Router();
const c = require('../controllers/outrosController');

router.get('/', c.listarDoacoes)
router.post('/', c.criarDoacaoItem)

module.exports = router;