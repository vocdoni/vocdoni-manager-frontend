import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../components/app-context'
import Link from "next/link"
// import MainLayout from "../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const IndexPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <IndexView {...context} />
}

type State = {
  id?: string
  // TODO:
}

// Stateful component
class IndexView extends Component<IAppContext, State> {
  state: State = {}

  componentDidMount() {
    this.setState({ id: location.hash.substr(2) })

    // TODO: FETCH ANY METADATA

    this.props.setTitle("Entities")
  }

  render() {
    return <div id="index">
      <p>Main page</p>
      <p><Link href="/entities/#/0x1234-entity-id"><a>Entity view (info, processes and news)</a></Link></p>
      <p><Link href="/entities/edit/#/0x1234-entity-id"><a>Entity edit</a></Link></p>
      <p><Link href="/entities/new/#/0x1234-entity-id"><a>Entity create</a></Link></p>
      <p><Link href="/processes/#/0x2345-entity-id"><a>Process view</a></Link></p>
      <p><Link href="/processes/new"><a>Process create</a></Link></p>
      <p><Link href="/processes/edit/#/0x2345-entity-id"><a>Process edit</a></Link></p>
      <p><Link href="/posts/#/0x12345-entity-id/<idx>"><a>News post view</a></Link></p>
      <p><Link href="/posts/edit/#/0x12345-entity-id/<idx>"><a>News post edit</a></Link></p>
      <p><Link href="/posts/new/#/0x12345-entity-id/<idx>"><a>News post create</a></Link></p>
    </div >
  }
}

// // Custom layout example
// IndexPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default IndexPage
