import { Hono } from "hono";
import { PostRoutes } from "../RouteConstants";
import { useProtectedRoute } from "../protectedRoute";
import { UnuploadedPost } from "../../data/models/bodyData/Post";
import { createPost, getUserPosts } from "../../data/neo4j/posts";

const app = new Hono()

app.post(PostRoutes.CREATE, (c, next) => useProtectedRoute(c, next), async (c) => {
    const unuploadedPost = await c.req.json<UnuploadedPost>()

    const post = await createPost(unuploadedPost)

    return c.json({
        message: 'Post created',
        post
    })
})

app.get(PostRoutes.GET_USER_POSTS, (c, next) => useProtectedRoute(c, next), async (c) => {
    const { userId } = c.req.query()

    const posts = await getUserPosts(parseInt(userId))

    return c.json({
        message: 'Posts retrieved',
        posts
    })
})

export default app
