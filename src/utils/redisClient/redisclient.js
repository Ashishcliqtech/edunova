const { Redis } = require("@upstash/redis");
const config = require("../../config/config");

const redis = new Redis({
  url: config.UPSTASH_REDIS_REST_URL,
  token: config.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = redis;
