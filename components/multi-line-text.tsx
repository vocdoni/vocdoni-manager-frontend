export default function MultiLine(props: { text: string, children?: any }) {
    if (!props.text) return props.children

    const lines = props.text.trim().split("\n").filter(l => !!l)
    const result: (string | any)[] = []
    for (const line of lines) {
        result.push(<span key={line}>{line}</span>)
        result.push(<br key={line + "br"} />)
    }
    result.pop()

    return result
}
