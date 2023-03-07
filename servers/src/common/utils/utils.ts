import { RedisKeyPrefix } from '../enums/redis-key-prefix.enum'
import fs from 'fs'
/**
 * 获取 模块前缀与唯一标识 整合后的 redis key
 * @param moduleKeyPrefix 模块前缀
 * @param id id 或 唯一标识
 */
export function getRedisKey(moduleKeyPrefix: RedisKeyPrefix, id: string | number): string {
  return `${moduleKeyPrefix}${id}`
}

/**
 * 写出数据流到目标文件
 * @param location 目标路径
 * @param fileStream 文件流
 */
export function writeToFile(location: string, fileStream: Buffer) {
  console.log('写出到文件：', location)

  // fs 创建文件写入流
  const writeFile = fs.createWriteStream(location)
  // 写入文件
  writeFile.write(fileStream)
  // 千万别忘记了 关闭流
  writeFile.close()
}

/**
 * 清空并删除目录
 * @param path
 */
export function removeDir_All(path) {
  const files = fs.readdirSync(path) //同步读取文件夹
  files.forEach((file) => {
    //删除文件夹中的所有文件/夹
    const filePath = `${path}/${file}`
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      removeDir_All(filePath)
    } else {
      fs.unlinkSync(filePath)
      // console.log(`删除${file}文件成功`)
    }
  })
  fs.rmdirSync(path) //删除文件夹
}
