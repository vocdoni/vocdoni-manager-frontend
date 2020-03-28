import en from "./en"

let main: { [k: string]: string }

switch (process.env.LANG) {
    default:
        main = en as any
        break
}

export { main }
export { en }
