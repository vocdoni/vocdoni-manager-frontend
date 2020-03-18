import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const ProcessNewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <ProcessNew {...context} />
}

type State = {
  // TODO:
}

// Stateful component
class ProcessNew extends Component<IAppContext, State> {
  state = {}

  componentDidMount() {
    this.props.setTitle("Create process")
  }

  render() {
    return <div id="process-new">
      <p>Process New</p>
    </div>
  }
}


// // Using a custom layout
// ProcessNewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default ProcessNewPage
