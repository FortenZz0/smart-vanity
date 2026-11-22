import Fastify from 'fastify'

const app = Fastify({ exposeHeadRoutes: false })
const port = Number(process.env.PORT ?? 3000)

app.get('/api/health', (_request, reply) => {
  return reply.header('Cache-Control', 'no-store').send({ status: 'ok' })
})

const address = await app.listen({ host: '127.0.0.1', port })
console.log(`Smart Vanity API listening on ${address}`)
