import { defineComponent } from "vue";

<template>
  <div>
    <div class="filter-container">
      <div class="filter-item">
        <el-upload
          class="upload-demo"
          ref="uploadCreateRef"
          :on-change="raw => doUpload(raw)"
          :auto-upload="false"
          :show-file-list="false"
          :limit="1"
        >
          <el-button type="primary">点击上传</el-button>
        </el-upload>
      </div>
      <div class="filter-item">
        <el-date-picker v-model="searchDate" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :disabledDate="disabledDate" clearable></el-date-picker>
      </div>
      <div class="filter-action-wrapper filter-item">
        <el-button type="primary" @click="searchEvent">搜索</el-button>
      </div>
    </div>
    <k-table ref="ossTableRef" v-bind="fileData" :callback="getFileList" :loading="loading"  border stripe current-row-key="id" style="width: 100%">
      <template  #url="{ row }">
        <el-link type="primary" :href="row.url" target="_blank">
          {{ row.url }}
        </el-link>
      </template>
      <template  #actions="{ row }">
        <el-upload
          class="upload-demo"
          ref="uploadCreateRef"
          :on-change="raw => doReUpload(raw, row)"
          :auto-upload="false"
          :show-file-list="false"
          :limit="1"
          style="display: inline; margin-right: 20px"
        >
          <el-button type="primary">重新上传</el-button>
        </el-upload>
        <el-button type="warning" plain @click="doDelete(row)">删除</el-button>
      </template>
    </k-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { IKTableProps } from '@/plugins/k-ui/packages/table/src/Table.type'
import { ListResultData, Pagination } from '@/common/types/apiResult.type'
import { deleteFile, fileUpload, getFileList as getFileListApi, OssApiResult } from '@/api/oss'
import { jsonTimeFormat, tranFileSize } from '@/utils/index'
import { UploadFile } from 'element-plus/es/components/upload/src/upload.type'
import config from '@/config/index'

export default defineComponent({
  setup () {
    const fileData = ref<IKTableProps<OssApiResult>>({
      mode: 'config',
      data: { list: [], total: 0 },
      auto: true,
      isPager: true,
      columns: [
        { label: '文件', prop: 'url', width: 800, slot: true },
        { label: '用户', prop: 'userAccount' },
        { label: '大小', prop: 'size', formatter: (row: OssApiResult) => tranFileSize(row.size) },
        { label: '上传时间', prop: 'createDate', width: 180, formatter: (row: OssApiResult) => jsonTimeFormat(row.createDate) },
        { label: '操作', prop: 'actions', slot: true }
      ],
      index: true
    })

    const ossTableRef = ref()
    const uploadCreateRef = ref()
    const uploadRenewRef = ref()

    const loading = ref<boolean>(false)
    const searchDate = ref<string[]>([])
    let searchDateTmp: string[] = []
    const getFileList = async ({ page, size }: Pagination) => {
      loading.value = true
      const res = await getFileListApi({ page, size, ...searchDateTmp.length === 2 ? { startDay: searchDateTmp[0], endDay: searchDateTmp[1] } : null })
      loading.value = false
      if (res?.code === 200) {
        var data = res.data as ListResultData<OssApiResult>
        data.list.forEach(one => {
          one.url = `http://${location.host}/api/oss/view/${one.id}`
        })
        fileData.value.data = data
      } else {
        ElMessage({ message: res?.msg || '网络异常，请稍后重试', type: 'error' })
      }
    }

    const searchEvent = () => {
      searchDateTmp = searchDate.value ? [...searchDate.value] : []
      ossTableRef.value.refreshData({ page: 1, size: 10 })
    }

    const nowDate = new Date().getTime()

    // 日期范围
    const disabledDate = (date: Date) => {
      return nowDate < date.getTime()
    }

    // 上传pdf文件到目标目录去
    const doUpload = async (uploadFile: UploadFile, ossResult: OssApiResult) => {
      const formData = new FormData()
      formData.set('file', uploadFile.raw)
      formData.set('business', '描述信息')
      if (ossResult) {
        formData.set('ori_oss', JSON.stringify(ossResult))
      }
      const res = await fileUpload(formData)
      if (res.code === 200) {
        ElMessage.success('上传成功')
      } else {
        ElMessage.error('上传失败')
      }
      uploadCreateRef.value.clearFiles()
      await getFileList(ossTableRef.value.pager)
    }

    const doReUpload = async (uploadFile: UploadFile, ossResult: OssApiResult) => {
      return await doUpload(uploadFile, ossResult)
    }

    const doDelete = async (row: OssApiResult) => {
      console.log(row)
      const res = await deleteFile(row)
      if (res.code === 200) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error('删除失败')
      }
      await getFileList(ossTableRef.value.pager)
    }

    return {
      loading,
      fileData,
      getFileList,
      searchDate,
      searchEvent,
      ossTableRef,
      disabledDate,
      doUpload,
      doReUpload,
      doDelete
    }
  }
})
</script>
