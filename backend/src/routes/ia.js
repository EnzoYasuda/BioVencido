const fetch = require('node-fetch')
const router = require('express').Router()

router.post('/', async (req, res) => {
  const { ingredientes, alergias } = req.body

  const ingredientesStr = ingredientes?.length
    ? ingredientes.join(', ')
    : 'Nenhum ingrediente próximo do vencimento'

  const alergiasStr = alergias?.length
    ? alergias.join(', ')
    : 'Nenhuma'

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Você é um chef especialista em aproveitar alimentos antes do vencimento.

Ingredientes disponíveis (prestes a vencer): ${ingredientesStr}
Alergias do usuário: ${alergiasStr}

Gere EXATAMENTE 2 receitas que usem esses ingredientes e respeitem as alergias.

Responda APENAS com JSON válido, sem texto antes ou depois:
[
  {
    "emoji": "🍕",
    "nome": "Nome da receita",
    "descricao": "Descrição curta",
    "categoria": "Salgado",
    "tempo": 30,
    "dificuldade": "Fácil",
    "tags": ["Ingrediente1"],
    "ingredientes": ["item 1", "item 2"],
    "modoPreparo": ["Passo 1", "Passo 2"],
    "alergenos": []
  }
]`
        }]
      })
    })

    const data   = await response.json()
    const texto  = data.choices[0].message.content.trim()

    // Remove possíveis blocos de markdown (```json ... ```)
    const limpo  = texto.replace(/```json|```/g, '').trim()
    const receitas = JSON.parse(limpo)

    res.json(receitas)

  } catch (err) {
    console.error('Erro ao chamar Groq:', err)
    res.status(500).json({ error: 'Erro ao gerar receitas' })
  }
})

module.exports = router