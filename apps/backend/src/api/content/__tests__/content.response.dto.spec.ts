import { ContentResponseDto, ContentStatusResponseDto } from '../content.response.dto';

describe('ContentResponseDto', () => {
  it('should map entity with all fields', () => {
    const entity = {
      id: 'c1',
      node_id: 'node1',
      text: '## Lesson\n\nContent here',
      audio_url: '/media/audio/node1.wav',
      video_url: '/media/video/node1.mp4',
      text_status: 'ready',
      audio_status: 'ready',
      video_status: 'ready',
      created_at: new Date('2026-03-22'),
      updated_at: new Date('2026-03-22'),
    } as any;

    const dto = ContentResponseDto.fromEntity(entity);
    expect(dto.id).toBe('c1');
    expect(dto.nodeId).toBe('node1');
    expect(dto.text).toContain('Lesson');
    expect(dto.audioUrl).toBe('/media/audio/node1.wav');
    expect(dto.videoUrl).toBe('/media/video/node1.mp4');
    expect(dto.textStatus).toBe('ready');
    expect(dto.audioStatus).toBe('ready');
    expect(dto.videoStatus).toBe('ready');
  });

  it('should handle null media fields', () => {
    const entity = {
      id: 'c2',
      node_id: 'node2',
      text: null,
      audio_url: null,
      video_url: null,
      text_status: 'pending',
      audio_status: 'pending',
      video_status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    const dto = ContentResponseDto.fromEntity(entity);
    expect(dto.text).toBeNull();
    expect(dto.audioUrl).toBeNull();
    expect(dto.videoUrl).toBeNull();
  });
});

describe('ContentStatusResponseDto', () => {
  it('should return only status fields', () => {
    const entity = {
      id: 'c1',
      node_id: 'node1',
      text: 'should not appear',
      text_status: 'ready',
      audio_status: 'generating',
      video_status: 'pending',
    } as any;

    const dto = ContentStatusResponseDto.fromEntity(entity);
    expect(dto.textStatus).toBe('ready');
    expect(dto.audioStatus).toBe('generating');
    expect(dto.videoStatus).toBe('pending');
    expect(dto).not.toHaveProperty('text');
    expect(dto).not.toHaveProperty('id');
  });
});
