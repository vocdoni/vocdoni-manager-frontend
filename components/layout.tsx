// import Link from "next/link"
// import AppContext from './app-context'


type Props = {
    children: Element[],
    title: string
}

export default ({ children, title, ...props }: Props) => <div id="layout" {...props}>
    <div className="top-bar">
        <h2>{title || "Entities"}</h2>
    </div>

    <div className="content">
        {children}
    </div>
</div>
