import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const ProcessNewPage = props => {
  // Get the global context props we might use
  const { onGatewayError } = useContext(AppContext)

  return <ProcessNew onGatewayError={onGatewayError} />
}

type State = {
  // TODO:
}

// Stateful component
class ProcessNew extends Component<IAppContext, State> {
  state = {}

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
