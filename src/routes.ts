import {
  FastifyPluginAsyncTypebox, Type
} from "@fastify/type-provider-typebox";
import { addUser, getUsers, removeUser } from "./usrbgStore.js";
import env from "./env.js";
import { UnauthorizedError } from "http-errors-enhanced";

const routes: FastifyPluginAsyncTypebox = async function(
  fastify
): Promise<void> {
  fastify.get("/healthcheck", {}, async () => {
    return { health: "OK" };
  });

  fastify.get("/users", {}, async (request) => {
      return {
        endpoint: env.bucket.endpoint,
        bucket: env.bucket.name,
        prefix: env.bucket.prefix,
        users: getUsers()
      };
    }
  );

  fastify.post("/bucket-events", {
    schema: {
      body: Type.Object({
        EventType: Type.String(),
        Key: Type.String()
      })
    }
  }, async ({ body, headers }, reply) => {
    if (headers.authorization !== env.authorization) {
      throw new UnauthorizedError;
    }

    reply.status(204);
    if (!body.Key.startsWith(env.bucket.prefix)) {
      return;
    }

    const key = body.Key.substring(env.bucket.prefix.length);
    if (body.EventType.startsWith("s3:ObjectCreated:")) {
      addUser(key);
    } else if (body.EventType.startsWith("s3:ObjectRemoved:")) {
      removeUser(key);
    }
  });
};

export default routes;
