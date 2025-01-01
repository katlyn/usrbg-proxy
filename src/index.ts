import buildServer from "./server.js";
import env from "./config/env.js";
import { getUsers, updateUsers } from "./usrbgStore.js";
import valkey from "./config/valkey.js";

const server = await buildServer({
  logger: { level: "info" },
  trustProxy: env.http.trustProxy
});

server.listen(
  {
    host: env.http.host,
    port: env.http.port
  },
  (err, address) => {
    if (err !== null) {
      server.log.error(err);
      process.exit(1);
    }
    server.log.info(`Listening on ${address}`);
  }
);

// Update the list fully every 15 minutes
process.on("SIGTERM", () => shouldFetch = false);
let shouldFetch = true;
const sleep = (time: number) => new Promise(res => setTimeout(res, time));
while (shouldFetch) {
  // Check if the lock key exists to stop us from hammering the S3 bucket too much
  const result = await valkey.set("usrbg:users:last-updated", Date.now(), "EX", 60 * 15, "NX");
  if (result === null) {
    // The dataset has been updated too recently, don't touch it
    const ttl = await valkey.ttl("usrbg:users:last-updated");
    server.log.info(`Not updating users, cache key exists, lock expires in ${ttl} seconds`);
  } else {
    const users = await updateUsers();
    server.log.info(`Updated ${Object.keys(users).length} users`);
  }
  // Wait a minute before retying
  await sleep(1000 * 60);
}
