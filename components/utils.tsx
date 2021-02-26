import { Modal } from 'antd'
import Router from 'next/router'

import i18n from '../i18n'
import Ficon from './ficon'

// Helper function for showing a modal when the entity is not found
export const entityNotFoundModal = (onCancel: () => void) : any => Modal.confirm({
    title: i18n.t('entity.error.not_found'),
    icon: <Ficon icon='AlertCircle' />,
    content: i18n.t('account.error.not_found_description'),
    okText: i18n.t('entity.btn.create'),
    okType: 'primary',
    cancelText: 'Not now',
    onOk: () => {
        Router.push('/entities/new')
    },
    onCancel,
})
