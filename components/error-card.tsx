import { Card } from 'antd'
import React, { FunctionComponent, ReactChild } from 'react'

import { main } from '../i18n'

const ErrorCard : FunctionComponent = (props: { children?: ReactChild }) => <Card>
    {props && props.children || main.generalErrorMessage}
</Card>

export default ErrorCard
