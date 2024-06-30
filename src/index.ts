import { Hono } from 'hono'
import UserRoutes, { PostRoutes, RedisRoutes } from './routes/RouteConstants'
import users from '../src/routes/user/users'
import posts from './routes/post/post'
import redis from './routes/redisControl/redisControl'

const app = new Hono()

app.route(UserRoutes.USER_BASE_ROUTE, users)
app.route(PostRoutes.POST_BASE_ROUTE, posts)
app.route(RedisRoutes.REDIS_BASE_ROUTE, redis)

export default app
