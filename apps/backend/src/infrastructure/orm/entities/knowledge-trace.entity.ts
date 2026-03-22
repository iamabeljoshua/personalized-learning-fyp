import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('knowledge_traces')
@Unique(['node_id', 'student_id'])
export class KnowledgeTraceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  node_id: string;

  @Column()
  student_id: string;

  @Column({ type: 'float', default: 0.3 })
  p_known: number;

  @Column({ type: 'float', default: 0.2 })
  p_learn: number;

  @Column({ type: 'float', default: 0.25 })
  p_guess: number;

  @Column({ type: 'float', default: 0.1 })
  p_slip: number;

  @UpdateDateColumn()
  updated_at: Date;
}
