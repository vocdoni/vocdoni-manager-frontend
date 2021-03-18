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

export interface IWallet {
    name: string,
    seed: string,
    publicKey: string,
    // A unique random identifier for this wallet (telemetry purposes)
    uid: number,
    longName?: string,
    avatar?: string,
}

export interface IMember {
    id: string,
    name: string,
    lastName: string,
    email: string,
    dateOfBirth: any,
    verified: any,
    tags: number[],
}

export interface ITarget {
    id: string,
    name: string,
    description: string,
    filters: [],
}

export interface ITag {
    name: string,
    type: string,
}

export interface ICensus {
    id: string,
    name: string,
    target: ITarget,
    merkleRoot?: string,
    merkleTreeUri?: string,
    size: number,
    createdAt: string,
}

export type MemberImportData = {
    firstName: string,
    lastName: string,
    email: string,
}

export type VotingFormImportData = {
    title: string,
    digestedHexClaims: string[],
}

export type QuestionAnswer = {
    question: string,
    answer: string,
}
