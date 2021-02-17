import { Card } from 'antd'
import React, { FunctionComponent, ReactChild } from 'react'

import i18n from '../i18n'

const ErrorCard : FunctionComponent = (props: { children?: ReactChild }) => <Card>
    {props && props.children || i18n.t('generalErrorMessage')}
</Card>

export default ErrorCard
