export default `
    type Post{
        _id: ID!
        by: User
        desc:String
        photo: String
        likeBy:[User] 
        comments:[User]
        createAt: String
    }
    type Query{
        getPost(_id:ID!): Post!
    }
    input iBy{
        username: String
        tumbnail: String
    }
    input iPost{
        desc:String
        photo: String
    }
    type Mutation{
        createPost(post: iPost): Post!
    }
`;