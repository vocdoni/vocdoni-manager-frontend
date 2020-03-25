import Link from "next/link"
import AppContext from './app-context'
import { useContext } from "react"


type Props = {
    children: Element[],
    title: string
}

export default function ({ children, ...props }: Props) {
    const { title } = useContext(AppContext)

    return <div id="layout" {...props}>
        <div className="top-bar">
            <Link href="/"><a><span className="title">{title || "Entities"}</span></a></Link>
        </div>

        <div className="content">
            {children}
        </div>
    </div>
}
