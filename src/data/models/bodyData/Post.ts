export interface PostUser {
    username: string
    displayName: string
    userId: number
    profilePictureUrl?: string
}
  
export interface Media {
    imageUrl?: string
    videoUrl?: string
    linkUrl?: string
}

export interface Engagement {
    reposts: number
    likes: number
    comments: number
}

export interface UnuploadedPost {
    userId: number
    content: string
    media?: Media
    metadata: {
        location?: string
    }
    hashtags?: string[]
    mentions?: string[]
    createdAt: number
}

export interface UnregisteredPost extends UnuploadedPost {
    engagement: Engagement
    media: Media
    hashtags: string[]
    mentions: string[]
}

export interface Post extends UnregisteredPost {
    id: number
    user: PostUser
}