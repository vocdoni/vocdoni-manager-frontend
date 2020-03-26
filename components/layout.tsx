import Link from "next/link"
import AppContext from './app-context'
import { useContext } from "react"


type Props = {
    children: any,
    title?: string
}

export default function ({ children, ...props }: Props) {
    let title = props && props.title
    if (!title) {
        const context = useContext(AppContext)
        if (context) title = context.title
    }

    return <div id="layout" {...props}>
        <div className="top-bar">
            <Link href="/"><a><span className="title">{title || "Entities"}</span></a></Link>
        </div>

        <div className="content">
            {children}
        </div>
    </div>
}
