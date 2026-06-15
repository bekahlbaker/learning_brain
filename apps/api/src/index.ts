import Fastify from 'fastify'
import { directiveRoute } from './routes/directive'
import { eventsRoute } from './routes/events'

const server = Fastify({ logger: true })

void server.register(directiveRoute)
void server.register(eventsRoute)

server.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})
