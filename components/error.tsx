// import Link from "next/link"
import { main } from "../i18n"

const ErrorPage = (props: { message?: string }) => <div id="global-message">
    <div className="card">
        <div>{props && props.message || main.generalErrorMessage}</div>
    </div>
</div>

export default ErrorPage
