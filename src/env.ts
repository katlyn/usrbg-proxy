import { secret, strictVerify, transform } from "env-verifier";

// This object contains any default values that we want to be present in the environment. This is good for defining
// default ports, hostnames, or similar. All values must be a string.
export const defaults: Record<string, string> = {
  HTTP_HOST: "0.0.0.0",
  HTTP_PORT: "8080",
  HTTP_TRUST_PROXY: "false"
};

export const config = {
  http: {
    host: "HTTP_HOST",
    port: transform("HTTP_PORT", Number),
    trustProxy: transform("HTTP_TRUST_PROXY", (v) => {
      if (v.toLowerCase() === "true") {
        return true;
      }
      const parsed = Number(v);
      if (!isNaN(parsed)) {
        return parsed;
      }
      if (v.includes(".") || v.includes(":")) {
        return v.split(",").map((s) => s.trim());
      }
      return false;
    })
  },
  bucket: {
    endpoint: "BUCKET_ENDPOINT",
    publicEndpoint: "BUCKET_PUBLIC_ENDPOINT",
    name: "BUCKET_NAME",
    prefix: "BUCKET_PREFIX"
  },
  authorization: "EVENT_AUTHORIZATION"
};

const env = strictVerify<typeof config>(config, {
  ...defaults,
  ...process.env
});
export default env;
