import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const ProcessViewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <ProcessView {...context} />
}

type State = {
  id?: string
  // TODO:
}

// Stateful component
class ProcessView extends Component<IAppContext, State> {
  state: State = {}

  componentDidMount() {
    this.setState({ id: location.hash.substr(2) })

    // TODO: FETCH METADATA

    this.props.setTitle(`Process ${location.hash.substr(2)}`)
  }

  render() {
    return <div id="process-view">
      <p>Process view</p>
      <pre>I am {this.state.id}</pre>
    </div>
  }
}


// // Using a custom layout
// ProcessViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default ProcessViewPage
