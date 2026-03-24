export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).end()

  const { pin } = req.body || {}
  const correct = process.env.ADMIN_KEY

  if (!correct) return res.status(500).json({ ok: false, error: 'ADMIN_PIN not configured' })
  if (!pin || pin !== correct) return res.status(401).json({ ok: false })

  return res.json({ ok: true })
}
