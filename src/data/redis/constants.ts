
const redisConstants = {
    
}

export const getFollowersKey = (userId: number) => `followers_count:${userId}`

export const getFollowingKey = (userId: number) => `following_count:${userId}`

export const getPostsKey = (userId: number) => `posts_count:${userId}`

export default redisConstants
