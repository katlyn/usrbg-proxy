import {
  FastifyPluginAsyncTypebox, Type
} from "@fastify/type-provider-typebox";
import { addUser, getCachedResponse, getUsers, removeUser } from "./usrbgStore.js";
import env from "./config/env.js";
import { UnauthorizedError } from "http-errors-enhanced";

const routes: FastifyPluginAsyncTypebox = async function(
  fastify
): Promise<void> {
  fastify.get("/healthcheck", {}, async () => {
    return { health: "OK" };
  });

  fastify.get("/users", {}, async (_request, reply) => {
      reply.header("content-type", "application/json");
      return getCachedResponse();
    }
  );

  fastify.post("/bucket-events", {
    schema: {
      body: Type.Object({
        Records: Type.Array(Type.Object({
          eventName: Type.String(),
          s3: Type.Object({
            bucket: Type.Object({
              name: Type.String()
            }),
            object: Type.Object({
              key: Type.String(),
              eTag: Type.String()
            })
          })
        }))
      })
    }
  }, async ({ body, headers }, reply) => {
    if (headers.authorization !== env.authorization) {
      throw new UnauthorizedError;
    }

    for (const { eventName, s3: { bucket, object } } of body.Records) {
      const baseKey = decodeURIComponent(object.key);
      if (bucket.name !== env.bucket.name || !baseKey.startsWith(env.bucket.prefix)) {
        continue;
      }

      const key = baseKey.substring(env.bucket.prefix.length);
      if (eventName.startsWith("s3:ObjectCreated:")) {
        await addUser(key, object.eTag);
      } else if (eventName.startsWith("s3:ObjectRemoved:")) {
        await removeUser(key);
      }
    }

    reply.status(204);
  });
};

export default routes;
