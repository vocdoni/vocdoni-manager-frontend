// import Link from "next/link"
import i18n from '../i18n'

const ErrorPage = (props: { message?: string }) => <div id="global-message">
    <div className="card">
        <div>{props && props.message || i18n.t('generalErrorMessage')}</div>
    </div>
</div>

export default ErrorPage
