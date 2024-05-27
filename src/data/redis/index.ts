import Redis from "ioredis"

const redisClient = new Redis()

redisClient.on('error', (e) => {
    console.log('error ->', e)
})

redisClient.on('connect', () => {
    console.log('Redis connected')
})

export default redisClient