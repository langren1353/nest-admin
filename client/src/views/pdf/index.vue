<template>
  <div>
    <div v-if="maxPage === 0" style="text-align: center; margin-top: 30vh; overflow: hidden">
      <h1>无内容</h1>
    </div>
    <div v-else>
      <flipbook v-if="isLoaded" class="flipbook" :pages="pdfImageUrlList" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getOSSInfo, OssApiResult } from '@/api/oss'
import Flipbook from 'flipbook-vue'
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ResultData } from '@/common/types/apiResult.type'
import { ElMessage } from 'element-plus'

const $route = useRoute()
let pdfImageUrlList: string[] = reactive([])
const isLoaded = ref(false)

const { params: { id: pdf_id = '' } = {} } = $route
const maxPage = ref(0)

onMounted(async () => {
  // 尝试加载pdf的接口，获取最大页面数
  const ossResult: ResultData<OssApiResult> = await getOSSInfo(pdf_id)
  const ossInfo = ossResult.data as OssApiResult
  if (ossInfo) {
    maxPage.value = +ossInfo.pdfPageCount

    const imageList = []
    for (let index = 1; index <= maxPage.value; index++) {
      const imageUrl = `/api/oss/view/${pdf_id}/${index}`
      imageList.push(imageUrl)
    }
    console.log('总页数为', maxPage)
    console.log('图片地址为：')
    console.log(imageList)
    pdfImageUrlList = reactive(imageList)
    isLoaded.value = true
  } else {
    ElMessage.error('无法加载目标文档，可能已被删除')
  }
})
</script>

<style lang="scss" scoped>
.flipbook {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
