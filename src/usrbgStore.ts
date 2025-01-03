import * as Minio from "minio";

import env from "./config/env.js";
import { Cache } from "./cache.js";
import valkey from "./config/valkey.js";

const minio = new Minio.Client({
  endPoint: env.bucket.endpoint,
  // Not needed since we're just doing public access
  accessKey: "",
  secretKey: ""
});

const cache = new Cache(valkey);

export async function getCachedResponse() {
  return await valkey.get("usrbg:users:response") ?? await storeCachedResponse();
}

export async function storeCachedResponse() {
  const response = JSON.stringify({
    endpoint: `https://${env.bucket.publicEndpoint}`,
    bucket: env.bucket.name,
    prefix: env.bucket.prefix,
    users: await getUsers()
  });
  await valkey.set("usrbg:users:response", response);
  return response;
}

export async function getUsers() {
  // Trim down etag to the first 4 chars to save a bit of space
  return Object.fromEntries(Object.entries(await cache.getAll()).map(([k, v]) => [k, v.substring(0, 4)]));
}

export async function addUser(uid: string, etag: string) {
  await cache.set(uid, etag);
  await storeCachedResponse();
}

export async function removeUser(uid: string) {
  await cache.delete(uid);
  await storeCachedResponse();
}

export async function updateUsers() {
  const objects = await listDirectory();
  await cache.setAll(Object.fromEntries(objects
    .filter(obj => obj.size > 0 && obj.name != undefined)
    // Minio etags are optional because they had a bug once upon a time, but for
    // all new files we can safely assume it'll be there
    .map(obj => [obj.name!.substring(env.bucket.prefix.length), obj.etag!])
  ));

  await storeCachedResponse();

  return getUsers();
}

function listDirectory(): Promise<Minio.BucketItem[]> {
  return new Promise((resolve, reject) => {
    const buff: Minio.BucketItem[] = [];
    const res = minio.listObjectsV2(env.bucket.name, env.bucket.prefix);
    res.on("data", data => buff.push(data));
    res.once("end", () => resolve(buff));
    res.on("error", reject);
  });
}
