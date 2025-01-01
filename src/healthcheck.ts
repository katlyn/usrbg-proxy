const healthcheck = await fetch(`http://${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/users`);
if (!healthcheck.ok) {
  throw new Error(healthcheck.statusText);
}
