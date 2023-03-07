<template>
  <el-dialog
    title="上传文档 - 只支持pdf"
    top="10vh"
    width="600px"
    close-on-press-escape
    :model-value="visible"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <el-form v-loading="isLoading" ref="formRef" v-if="visible" :rules="formRules" :model="formData">
      <el-form-item label="文件名称" prop="fileName">
        <el-input v-model="formData.fileName" placeholder="请输入文件名" />
      </el-form-item>

      <el-form-item label="文件描述" prop="business">
        <el-input v-model="formData.business" :rows="2" type="textarea" placeholder="文件描述" />
      </el-form-item>

      <el-form-item label="上传文件">
        <el-upload
          class="upload-demo"
          ref="uploadCreateRef"
          action="#"
          :on-change="(file: UploadFile) => (fileRaw = file.raw)"
          :auto-upload="false"
          :limit="1"
        >
          <el-button type="primary">点击上传</el-button>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button :disabled="isLoading" type="primary" @click="handleOk">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineExpose, reactive } from 'vue'

import { fileUpload, OssApiResult } from '@/api/oss'
import { ElMessage } from 'element-plus/es'
import type { FormInstance, FormRules } from 'element-plus'
import { UploadFile } from 'element-plus/es/components/upload/src/upload.type'

const $emit = defineEmits(['reload'])

const fileRaw = ref()
const visible = ref(false)
const isEdit = ref(false)
const isLoading = ref(false)

const formRef = ref()
const formRules = reactive<FormRules>({
  fileName: [{ required: true, message: '请输入文件名', trigger: 'blur' }],
  business: [{ required: true, message: '请输入描述信息', trigger: 'blur' }],
})
const formData = reactive({
  fileName: '',
  business: '',
})

let ori_oss: OssApiResult

const open = (ossData: OssApiResult): void => {
  visible.value = true
  if (ossData) {
    ori_oss = ossData
    isEdit.value = true
    formData.fileName = ori_oss.name
    formData.business = ori_oss.business
  } else {
    // 新建的时候
  }
}

const clear = (): void => {
  formData.fileName = ''
  formData.business = ''
  isEdit.value = false
  fileRaw.value = undefined
}

const handleClose = (): void => {
  clear()
  visible.value = false
}

const handleOk = async (): Promise<void> => {
  if (!(await formRef.value.validate())) {
    return
  }

  isLoading.value = true
  const fm = new FormData()
  fileRaw.value && fm.set('file', fileRaw.value)
  fm.set('name', formData.fileName)
  fm.set('business', formData.business)
  // 做修改用的
  if (isEdit.value) {
    fm.set('ori_oss', JSON.stringify(ori_oss))
  }
  const res = await fileUpload(fm)
  if (res.code === 200) {
    ElMessage.success(res.msg)
    $emit('reload')
    handleClose()
  } else {
    ElMessage.error(`上传失败${res.msg}`)
  }
  isLoading.value = false
}

defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
.bind-role-user-liet {
  min-height: 300px;

  .role-user-item {
    width: 360px;
    line-height: 36px;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.65);
    cursor: pointer;

    &.checked-user {
      color: #409eff;
    }

    .bind-role-user-account {
      min-width: 50px;
      display: inline-block;
    }
  }

  .bind-role-user-loading {
    text-align: center;
    color: #999;
    height: 60px;
    line-height: 60px;
  }
}
</style>
