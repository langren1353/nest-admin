import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsOptional } from 'class-validator'

import { ReqListQuery } from '../../../common/utils/req-list-query'

export class FindOssDto extends ReqListQuery {
  @ApiProperty({ description: '搜索条件，起始时间', required: false })
  @IsDateString()
  @IsOptional()
  public startDay?: string

  @ApiProperty({ description: '搜索条件，结束时间', required: false })
  @IsDateString()
  @IsOptional()
  public endDay?: string

  @ApiProperty({ description: '文件名', required: false })
  @IsOptional()
  public filename?: string
}
