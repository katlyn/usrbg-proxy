import { Redis } from "ioredis";
import env from "./env.js";

const valkey = new Redis(env.valkeyUri);
export default valkey;
