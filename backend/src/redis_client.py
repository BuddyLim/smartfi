import redis
from redis.asyncio import Redis as AsyncRedis


def get_redis_client():
    return redis.Redis(host="localhost", port=6379, decode_responses=True)


def get_async_redis_client():
    return AsyncRedis(host="localhost", port=6379, decode_responses=True)
