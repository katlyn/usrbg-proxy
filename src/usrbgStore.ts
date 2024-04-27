import * as Minio from "minio";

import env from "./env.js";

const minio = new Minio.Client({
  endPoint: env.bucket.endpoint,
  // Not needed since we're just doing public access
  accessKey: "",
  secretKey: ""
});

let cache = new Map<string, string>;

export function getUsers() {
  // Trim down etag to the first 4 chars to save a bit of space
  return [...cache].map(([k, v]) => [k, v.substring(0, 4)]);
}

export function addUser(uid: string, etag: string) {
  cache.set(uid, etag);
}

export function removeUser(uid: string) {
  cache.delete(uid);
}

export async function updateUsers() {
  const objects = await listDirectory();
  cache = new Map(objects
    .filter(obj => obj.size > 0 && obj.name != undefined)
    // Minio etags are optional because they had a bug once upon a time, but for
    // all new files we can safely assume it'll be there
    .map(obj => [obj.name!.substring(env.bucket.prefix.length), obj.etag!])
  );

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
