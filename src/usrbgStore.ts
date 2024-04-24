import * as Minio from "minio";

import env from "./env.js";

const minio = new Minio.Client({
  endPoint: env.bucket.endpoint,
  // Not needed since we're just doing public access
  accessKey: "",
  secretKey: ""
});

let cache = new Set<string>;

export function getUsers() {
  return [...cache];
}

export function addUser(uid: string) {
  cache.add(uid);
}

export function removeUser(uid: string) {
  cache.delete(uid);
}

export async function updateUsers() {
  const objects = await listDirectory();
  cache = new Set(objects
    .filter(obj => obj.size > 0 && obj.name != undefined)
    .map(obj => obj.name!.substring(env.bucket.prefix.length))
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
