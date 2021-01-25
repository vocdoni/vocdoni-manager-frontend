// import Link from "next/link"
import { main } from "../i18n"

const NotFound = () => <div id="page-body">
    <div className="not-found body-card">
        <h4>Oops, this is an error.</h4>
        <p>{main.notFound}</p>
    </div>
</div>

export default NotFound
