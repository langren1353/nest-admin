import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  HttpCode,
  Body,
  Req,
  Delete,
  Param, Response, StreamableFile
} from '@nestjs/common'
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiExtraModels, ApiBearerAuth } from '@nestjs/swagger';

import { ResultData } from '../../common/utils/result'

import { OssService } from "./oss.service"
import { FindOssDto } from './dto/find-oss.dto'
import { ApiResult } from '../../common/decorators/api-result.decorator'
import { OssEntity } from './oss.entity'
import {AllowAnon} from "../../common/decorators/allow-anon.decorator";

@ApiTags('文件存储')
@ApiBearerAuth()
@ApiExtraModels(ResultData, OssEntity)
@Controller('oss')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Post('upload')
  @ApiOperation({ summary: '文件上传,返回 url 地址' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          description: '文件',
          type: 'string',
          format: 'binary',
        },
        business: {
          description: '上传文件描述，可以是纯字符串，也可以是JSON字符串',
          type: 'string',
          format: 'text',
        },
        ori_oss: {
          description: '原始oss描述',
          type: 'object',
          format: 'json',
        }
      },
    },
  })
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiResult(OssEntity)
  async uploadFile (@UploadedFile() file: Express.Multer.File, @Body() params: { business: string, ori_oss: string }, @Req() req): Promise<ResultData> {
    return await this.ossService.create([file], params.business || '', params.ori_oss, req.user)
  }

  @Get('list')
  @ApiOperation({ summary: '查询文件上传列表' })
  @ApiResult(OssEntity, true, true)
  async findList (@Query() search: FindOssDto): Promise<ResultData> {
    return await this.ossService.findList(search)
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除文件，真删除，删除后无法恢复' })
  @ApiResult(OssEntity)
  async deleteItem(@Query() item: OssEntity): Promise<ResultData> {
    return await this.ossService.delete(item)
  }
  
  @Get('view/:id')
  @AllowAnon()
  async getFileById(@Param('id') id: number, @Response({ passthrough: true }) resp): Promise<StreamableFile> {
    console.log("输出文件了")
    return await this.ossService.getView(id, resp)
  }
}
