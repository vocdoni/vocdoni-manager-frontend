import React, { ReactElement, ReactNode } from 'react'
import i18n from '../i18n'

type Props = {
    title?: string,
    description?: string,
    children?: ReactNode,
}

// import Link from "next/link"
const NotFound : React.FC = ({title, description} : Props) : ReactElement => (
    <div id="page-body">
        <div className="not-found body-card">
            <h4>{ title || i18n.t('error.oops')}</h4>
            <p>{ description || i18n.t('error.not_found')}</p>
        </div>
    </div>
)

export default NotFound
