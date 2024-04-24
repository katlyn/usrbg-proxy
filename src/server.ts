import fastify from "fastify";
import fastifyCors from "@fastify/cors";

import traps from "@dnlup/fastify-traps";
import routes from "./routes.js";

interface ServerOptions {
}

export default async function buildServer(opts: ServerOptions = {}) {
  const server = fastify({ ...opts });

  await server.register(traps, { strict: false });
  await server.register(fastifyCors);
  await server.register(routes);

  return server;
}
