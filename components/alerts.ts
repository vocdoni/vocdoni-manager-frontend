import { message } from 'antd';
import { MessageType } from 'antd/lib/message'

import { isServer } from "../lib/util"

export function showSuccess(text: string) {
    if (!isServer()) message.success(text)
}
export function showInfo(text: string) {
    if (!isServer()) message.info(text)
}
export function showWarning(text: string) {
    if (!isServer()) message.warning(text)
}
export function showError(text: string) {
    if (!isServer()) message.error(text)
}
export function showLoading(text: string): MessageType {
    if (!isServer()) return message.loading(text)
}
