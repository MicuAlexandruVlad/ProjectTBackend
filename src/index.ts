import { Hono } from 'hono'
import UserRoutes, { PostRoutes } from './routes/RouteConstants'
import users from '../src/routes/user/users'
import posts from './routes/post/post'
import redisClient from './data/redis'

const app = new Hono()

app.route(UserRoutes.USER_BASE_ROUTE, users)
app.route(PostRoutes.POST_BASE_ROUTE, posts)

export default app
