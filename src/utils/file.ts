export const FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.bmp'

export const BIZ_TYPE_OPTIONS = [
  { value: 'document', label: '公文' },
  { value: 'contract', label: '合同' },
  { value: 'report', label: '报表' },
  { value: 'presentation', label: '演示文稿' },
  { value: 'spreadsheet', label: '表格' },
  { value: 'common', label: '其他' },
  { value: 'avatar', label: '头像' },
]

export const FILE_STATUS_OPTIONS = [
  { value: 'pending', label: '待审核', type: 'warning' as const },
  { value: 'approved', label: '已通过', type: 'success' as const },
  { value: 'rejected', label: '已驳回', type: 'danger' as const },
]

export const FILE_KIND_OPTIONS = [
  { value: 'image', label: '图片' },
  { value: 'pdf', label: 'PDF' },
  { value: 'word', label: 'Word' },
  { value: 'excel', label: 'Excel' },
  { value: 'ppt', label: 'PPT' },
  { value: 'text', label: '文本' },
]

export function bizTypeLabel(value?: string) {
  return BIZ_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '--'
}

export function fileStatusMeta(status?: string) {
  return (
    FILE_STATUS_OPTIONS.find((item) => item.value === status) ?? {
      value: 'approved',
      label: '已通过',
      type: 'success' as const,
    }
  )
}

export function formatFileSize(bytes?: number) {
  if (!bytes) {
    return '--'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename || 'download'
  link.click()
  URL.revokeObjectURL(href)
}
