// NEWS FEED

export interface INewsFeed {
    // OWN FIELDS
    version: string,
    title: string,
    homePageUrl: string,
    description: string,
    feedUrl: string,
    icon: string,
    favicon: string,
    expired: boolean,
    items: IFeedPost[],

    // INDEXING FIELDS
    entityId: string,
    language: string
}

export interface IFeedPost {
    id: string,
    title: string,
    summary: string,
    content_text: string,
    content_html: string,
    url: string,
    image: string,
    tags: string[],
    date_published: string,
    date_modified: string,

    author: {
        name: string,
        url: string
    }
}
