import type { UploadFile } from 'element-plus'

export type MyUploadFile = UploadFile & {
  type: string
}
