import i18n from '../i18n'

// import Link from "next/link"
const NotFound = () => <div id="page-body">
    <div className="not-found body-card">
        <h4>Oops, this is an error.</h4>
        <p>{i18n.t('notFound')}</p>
    </div>
</div>

export default NotFound
