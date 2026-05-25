const router = require('express').Router();
const c = require('../controllers/outrosController');

router.get('/', c.listarDespejo)
router.post('/', c.criarDespejo)

module.exports = router;