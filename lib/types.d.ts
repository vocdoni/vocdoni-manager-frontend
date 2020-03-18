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
    contentText: string,
    contentHtml: string,
    url: string,
    image: string,
    tags: string[],
    datePublished: string,
    dateModified: string,

    author: {
        name: string,
        url: string
    }
}
