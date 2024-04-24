import buildServer from "./server.js";
import env from "./env.js";
import { updateUsers } from "./usrbgStore.js";

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
  await updateUsers();
  server.log.info("Updated users");
  await sleep(15e3);
}

