const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/usuario', require('./routes/usuario'));
app.use('/itens', require('./routes/itens'));
app.use('/endereco', require('./routes/endereco'));
app.use('/despejo', require('./routes/locaisdespejo'));
app.use('/doacao', require('./routes/locaisdoacao'));
app.use('/receitas', require('./routes/receitas'));
app.use('/doacoes', require('./routes/doacoes'));

app.get('/', (req, res) => {
    res.json({ message: 'API do BioVencido rodando' });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});