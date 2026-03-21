import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { ContentResponseDto, ContentStatusResponseDto } from './content.response.dto';
import { AuthenticationGuard } from '../auth/authentication.guard';

@ApiTags('content')
@Controller('content')
@UseGuards(AuthenticationGuard)
@ApiBearerAuth()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /** Get content for an outline node */
  @Get(':nodeId')
  @ApiOkResponse({
    type: ContentResponseDto,
    description: 'Content item with text, audio, and video',
  })
  @ApiNotFoundResponse({ description: 'Content not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async getContent(@Param('nodeId') nodeId: string) {
    const content = await this.contentService.getByNodeId(nodeId);
    return ContentResponseDto.fromEntity(content);
  }

  /** Poll content generation status */
  @Get(':nodeId/status')
  @ApiOkResponse({
    type: ContentStatusResponseDto,
    description: 'Content generation status',
  })
  @ApiNotFoundResponse({ description: 'Content not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  async getStatus(@Param('nodeId') nodeId: string) {
    const content = await this.contentService.getByNodeId(nodeId);
    return ContentStatusResponseDto.fromEntity(content);
  }
}
