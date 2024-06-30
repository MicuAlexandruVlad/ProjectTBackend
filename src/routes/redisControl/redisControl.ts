import { Hono } from "hono";
import { RedisRoutes } from "../RouteConstants";
import redis from "../../data/redis";

// kept for testing only!!!!

const app = new Hono()

app.delete(RedisRoutes.NUKE, async (c) => {
    const keys = await redis.keys('*')
    await redis.del(...keys)

    return c.json({ message: 'Redis nuked' })
})

app.get(RedisRoutes.GET_USER, async (c) => {
    const { email } = c.req.query()

    if (email) {
        const result = await redis.get(email)

        if (result) {
            return c.json({ message: 'User found', data: result })
        } else {
            return c.json({ message: 'User not found' })
        }
    } else {
        return c.json({ message: 'Request is missing parameters' })
    }
})

export default app
