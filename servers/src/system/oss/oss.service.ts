import { Injectable, Response, StreamableFile } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { plainToInstance, instanceToPlain } from 'class-transformer'
import { Between, DataSource, Like, Repository } from 'typeorm'
import * as fs from 'fs'
import * as uuid from 'uuid'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import path from 'path'
import mime from 'mime-types'
import { createReadStream } from 'fs'
import { Canvas } from 'canvas'

import { ResultData } from '@utils/result'
import { AppHttpCode } from '../../common/enums/code.enum'

import { OssEntity } from './oss.entity'
import { FindOssDto } from './dto/find-oss.dto'
import { PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf'
import { writeToFile, removeDir_All } from '@utils/utils'

pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js'

@Injectable()
export class OssService {
  private readonly productLocation = process.cwd()
  private isAbsPath = false

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(OssEntity)
    private readonly ossRepo: Repository<OssEntity>,
    private readonly dataSource: DataSource,
  ) {
    this.isAbsPath = path.isAbsolute(this.config.get<string>('app.file.location'))
  }

  async create(
    file: Express.Multer.File,
    name: string,
    business: string,
    ori_oss_str: string = null,
    user: { id: string; account: string },
  ): Promise<ResultData> {
    let ori_ossEntity = plainToInstance(OssEntity, JSON.parse(ori_oss_str || '{}'))
    if (ori_ossEntity.id) {
      // 如果id存在，那么再查询，否则会刚好触发sql为空条件
      ori_ossEntity = await this.ossRepo.findOne({ where: { id: ori_ossEntity.id } })
    } else {
      ori_ossEntity = null
    }

    const ossList = []
    let pageCount = 0

    if (file) {
      const mimeType = file.mimetype

      if (!mimeType.includes('pdf')) {
        throw ResultData.fail(AppHttpCode.SERVICE_ERROR, '只支持pdf文件上传')
      }

      const fileName = `main.${mime.extension(file.mimetype)}`
      // 重新命名文件， uuid, 根据 mimeType 决定 文件扩展名， 直接拿后缀名不可靠
      const uuid_str = `${uuid.v4().replace(/-/g, '')}`

      // 文件存储路径
      const fileBasePath = path.normalize(
        this.isAbsPath
          ? `${this.config.get<string>('file.location')}/${uuid_str}`
          : path.join(this.productLocation, `${this.config.get<string>('app.file.location')}`, uuid_str),
      )

      const fileLocation = path.join(fileBasePath, fileName)
      fs.mkdirSync(fileBasePath)
      writeToFile(fileLocation, file.buffer)

      const ossEntity = plainToInstance(OssEntity, {
        name: name,
        id: undefined,
        url: `${this.config.get<string>('app.file.domain')}${
          this.config.get<string>('app.file.serveRoot') || ''
        }/${uuid_str}/${fileName}`, // url无用
        size: file.size,
        type: file.mimetype,
        location: fileLocation,
        business: business || '',
        userId: user.id,
        userAccount: user.account,
        pdfBaseDir: fileBasePath,
      })

      pageCount = await this.pdfSplit(file.buffer, ossEntity)
      console.log('页数有', pageCount)
      ossEntity.pdfPageCount = pageCount

      if (ori_ossEntity) {
        ossEntity.id = ori_ossEntity.id // id保持不变，其他的可以丢
      }

      ossList.push(ossEntity)
    } else {
      // 如果没有文件，但是是二次编辑的时候，那么也允许修改基本信息
      if (ori_ossEntity) {
        const new_oss = plainToInstance(OssEntity, {
          name: name,
          business: business || '',

          id: undefined,
          url: ori_ossEntity.url,
          size: ori_ossEntity.size,
          type: ori_ossEntity.type,
          location: ori_ossEntity.location,
          userId: ori_ossEntity.userId,
          userAccount: ori_ossEntity.userAccount,
          pdfBaseDir: ori_ossEntity.pdfBaseDir,
        })
        ossList.push(new_oss)
      }
    }

    const result = await this.dataSource.manager.transaction(async (transactionalEntityManager) => {
      return await transactionalEntityManager.save<OssEntity>(ossList)
    })

    if (!result) {
      return ResultData.fail(AppHttpCode.SERVICE_ERROR, '文件存储失败，请稍后重新上传')
    }

    // 做删除操作
    if (ori_ossEntity) {
      await this.delete(ori_ossEntity)
      return ResultData.ok(instanceToPlain(result), '更新成功')
    } else if (file) {
      return ResultData.ok(instanceToPlain(result), '上传成功，pdf包含' + pageCount + '页面')
    } else {
      return ResultData.fail(AppHttpCode.SERVICE_ERROR, '未包含pdf文件')
    }
  }

  async pdfSplit(filebuffer: Buffer, ossEntity: OssEntity): Promise<number> {
    const saveToImage = async (page: PDFPageProxy, toFilePath: string) => {
      const scale = 1.5

      const viewport = page.getViewport({ scale: 1 })

      // 默认视窗大小：595|841
      const use_width = viewport.width
      const use_height = viewport.height

      // 这里使用A4的大小
      // const use_width = 794
      // const use_height = 1123

      const canvas = new Canvas(scale * use_width, scale * use_height)
      const ctx = canvas.getContext('2d')

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        transform: [scale, 0, 0, scale, 0, 0],
      })

      return renderTask.promise.then(() => {
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })
        writeToFile(toFilePath, buffer)
      })
    }

    return pdfjs
      .getDocument(filebuffer)
      .promise.then(async (pdf): Promise<number> => {
        const maxLen = pdf.numPages
        const pages = []

        // 快速读入内存
        for (let index = 1; index <= maxLen; index++) {
          const page = await pdf.getPage(index)
          pages.push(page)
        }

        // 多次写出文件
        for (let index = 1; index <= maxLen; index++) {
          const imageName = `img_${index}.jpg`
          const saveImagePath = `${ossEntity.pdfBaseDir}/${imageName}`
          await saveToImage(pages[index - 1], saveImagePath) // 不用等待，这样web访问会更快，然后让他在后台跑呗
        }

        return new Promise((resolve) => {
          resolve(maxLen)
        })
      })
      .catch((err): Promise<number> => {
        console.error('pdf加载失败', err)
        return new Promise((resolve) => {
          resolve(0)
        })
      })
  }

  async findList(search: FindOssDto): Promise<ResultData> {
    const { size, page, startDay, endDay, filename } = search

    const whereDay = startDay && endDay ? { createDate: Between(`${startDay} 00:00:00`, `${endDay} 23:59:59`) } : {}
    const whereName = filename ? { name: Like(`%${filename}%`) } : {}

    const res = await this.ossRepo.findAndCount({
      order: { id: 'DESC' },
      skip: size * (page - 1),
      take: size,
      where: {
        ...whereDay,
        ...whereName,
      },
    })
    return ResultData.ok({ list: instanceToPlain(res[0]), total: res[1] })
  }

  async delete(ossData: OssEntity): Promise<ResultData> {
    let delRes: OssEntity
    const result = await this.dataSource.manager.transaction(async (transactionalEntityManager) => {
      delRes = await this.ossRepo.findOne({ where: { id: ossData.id } })
      try {
        // 先删除文件，无论删除是否成功都行的
        await removeDir_All(delRes.pdfBaseDir)
        // await fs.unlinkSync(delRes.location)
      } catch (e) {}
      // 再删除数据
      return await this.ossRepo.remove(delRes)
    })

    if (!result) {
      return ResultData.fail(AppHttpCode.SERVICE_ERROR, '删除失败，请稍后再试')
    }

    return ResultData.ok(instanceToPlain(delRes), '删除成功')
  }

  async getPdfView(oss_id: number, @Response() resp): Promise<StreamableFile> {
    const view = await this.ossRepo.findOne({ where: { id: oss_id } })
    const file = createReadStream(view.location)
    resp.set({
      'Content-Type': 'application/pdf',
    })
    return new StreamableFile(file)
  }

  async getPdfImageView(oss_id: number, image_id: number, @Response() resp): Promise<StreamableFile> {
    const view = await this.ossRepo.findOne({ where: { id: oss_id } })
    const imageLocation = path.join(view.pdfBaseDir, `img_${image_id}.jpg`)
    const file = createReadStream(imageLocation)
    resp.set({
      'Content-Type': 'image/png',
    })
    return new StreamableFile(file)
  }

  async getOssDetail(oss_id: number) {
    const view = await this.ossRepo.findOne({ where: { id: oss_id } })
    if (view) {
      return ResultData.ok(instanceToPlain(view), '获取成功')
    } else {
      return ResultData.ok(instanceToPlain(view), '获取失败，没有这个文档')
    }
  }
}
