/** UI 组件的公共类型。单独成文件，避免从 SFC 里导出类型。 */

export interface SegmentOption {
  label: string
  value: string
  icon?: string
}

export interface SelectOption {
  label: string
  value: string
  icon?: string
}

export interface TableColumn {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  /** 窄屏隐藏，保证移动端不横向滚动到失控 */
  hideOnMobile?: boolean
}
