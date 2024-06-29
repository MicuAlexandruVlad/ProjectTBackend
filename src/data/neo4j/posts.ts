import driver from ".";
import { Post, UnregisteredPost, UnuploadedPost } from "../models/bodyData/Post";
import { neo4jConstants } from "./Constants";

export const createPost = async (post: UnuploadedPost) => {
    const session = driver.session()

    const unregisteredPost: UnregisteredPost = {
        ...post,
        engagement: {
            reposts: 0,
            likes: 0,
            comments: 0
        },
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        media: post.media || {}
    }

    const query = `
        MATCH (u:${neo4jConstants.USER_ROLE}) WHERE ID(u) = $userId
        CREATE (p:${neo4jConstants.POST_ROLE})
        SET p.content = $content, 
            p.metadata = $metadata, 
            p.hashtags = $hashtags, 
            p.mentions = $mentions,
            p.media = $media, 
            p.engagement = $engagement, 
            p.userId = $userId,
            p.createdAt = $createdAt
        CREATE (u)-[:${neo4jConstants.POSTED_RELATIONSHIP}]->(p)
        RETURN p
    `

    const result = await session.run(query, {
        content: unregisteredPost.content,
        metadata: JSON.stringify(unregisteredPost.metadata),
        hashtags: unregisteredPost.hashtags,
        mentions: unregisteredPost.mentions,
        media: JSON.stringify(unregisteredPost.media),
        engagement: JSON.stringify(unregisteredPost.engagement),
        userId: unregisteredPost.userId,
        createdAt: unregisteredPost.createdAt
    })

    session.close()

    return result.records
}

export const getUserPosts = async (userId: number) => {
    const session = driver.session()

    const query = `
        MATCH (user:${neo4jConstants.USER_ROLE})-[:CREATED]->(post:${neo4jConstants.POST_ROLE} {userId: $userId})
        RETURN 
            post,
            {
                displayName: user.firstName + " " + user.lastName,
                username: user.username,
                profilePhotoUrl: user.profilePhotoUrl
            } AS user
        ORDER BY post.createdAt DESC
    `

    const result = await session.run(query, { userId })

    session.close()

    return result.records.length > 0 ? result.records : null
}
