export default function MultiLine(props: { text: string, children?: any }) {
    if (!props.text) return props.children

    const lines = props.text.trim().split("\n").filter(l => !!l)
    const result: (string | any)[] = []
    for (let line of lines) {
        result.push(<span key={line}>{line}</span>)
        result.push(<br key={line + "br"} />)
    }
    result.splice(result.length - 1, 1)

    return result
}
