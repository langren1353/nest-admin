<template>
  <div>
    <UploadDialog ref="uploadDlgRef" @reload="searchEvent" />
    <div class="filter-container">
      <div class="filter-item">
        <el-button type="primary" @click="showUploadDlg">上传</el-button>
      </div>
      <div class="filter-item">
        <el-date-picker
          v-model="searchDate"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :disabledDate="disabledDate"
          clearable
        ></el-date-picker>
      </div>
      <div class="filter-action-wrapper filter-item">
        <el-button type="primary" @click="searchEvent">搜索</el-button>
      </div>
    </div>
    <k-table
      ref="ossTableRef"
      v-bind="fileData"
      :callback="getFileList"
      :loading="loading"
      border
      stripe
      current-row-key="id"
      style="width: 100%"
    >
      <template #name="{ row }">
        <el-link type="primary" :href="`/pdf/${row.id}`" target="_blank">
          {{ row.name }}
        </el-link>
      </template>
      <template #actions="{ row }">
        <el-button type="primary" plain @click="showEdit(row)">编辑</el-button>
        <el-button type="danger" plain @click="doDelete(row)">删除</el-button>
        <el-button type="warning" plain @click="doCopy(row)">复制链接</el-button>
      </template>
    </k-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { IKTableProps } from '@/plugins/k-ui/packages/table/src/Table.type'
import { ListResultData, Pagination } from '@/common/types/apiResult.type'
import { deleteFile, getFileList as getFileListApi, OssApiResult } from '@/api/oss'
import { jsonTimeFormat, tranFileSize } from '@/utils/index'
import useClipboard from 'vue-clipboard3'
import UploadDialog from './components/UploadDialog.vue'

const { toClipboard } = useClipboard()

const fileData = ref<IKTableProps<OssApiResult>>({
  mode: 'config',
  data: { list: [], total: 0 },
  auto: true,
  isPager: true,
  columns: [
    {
      label: '文件',
      prop: 'name',
      width: 400,
      slot: true,
    },
    { label: '描述信息', prop: 'business' },
    { label: '用户', prop: 'userAccount' },
    { label: '大小', prop: 'size', formatter: (row: OssApiResult) => tranFileSize(row.size) },
    {
      label: '上传时间',
      prop: 'createDate',
      width: 180,
      formatter: (row: OssApiResult) => jsonTimeFormat(row.createDate),
    },
    { label: '操作', prop: 'actions', slot: true },
  ],
  index: true,
})

const ossTableRef = ref()
const uploadDlgRef = ref()

const loading = ref<boolean>(false)
const searchDate = ref<string[]>([])
let searchDateTmp: string[] = []

const getFileList = async ({ page, size }: Pagination): Promise<void> => {
  loading.value = true
  const res = await getFileListApi({
    page,
    size,
    ...(searchDateTmp.length === 2 ? { startDay: searchDateTmp[0], endDay: searchDateTmp[1] } : null),
  })
  loading.value = false
  if (res?.code === 200) {
    const data = res.data as ListResultData<OssApiResult>
    data.list.forEach((one) => {
      one.url = `http://${window.location.host}/api/oss/view/${one.id}`
    })
    fileData.value.data = data
  } else {
    ElMessage({ message: res?.msg || '网络异常，请稍后重试', type: 'error' })
  }
}

const searchEvent = (): void => {
  searchDateTmp = searchDate.value ? [...searchDate.value] : []
  ossTableRef.value.refreshData({ page: 1, size: 10 })
}

const nowDate = new Date().getTime()

// 日期范围
const disabledDate = (date: Date): boolean => {
  return nowDate < date.getTime()
}

const showUploadDlg = (): void => {
  uploadDlgRef.value.open()
}

const showEdit = (row: OssApiResult): void => {
  uploadDlgRef.value.open(row)
}

const doDelete = async (row: OssApiResult): Promise<void> => {
  const isSure = await ElMessageBox.confirm('请确认是否删除')
  if (isSure) {
    const res = await deleteFile(row)
    if (res.code === 200) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
    await searchEvent()
  }
}

const doCopy = async (row: OssApiResult): Promise<void> => {
  const finalUrl = `http://${window.location.host}/pdf/${row.id}`
  await toClipboard(finalUrl)
  ElMessage.success('复制成功')
}
</script>
