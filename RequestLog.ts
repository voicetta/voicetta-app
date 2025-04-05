import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('request_logs')
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  endpoint!: string;

  @Column()
  method!: string;

  @Column({ type: 'jsonb', nullable: true })
  requestBody?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  responseBody?: Record<string, any>;

  @Column({ nullable: true })
  statusCode?: number;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column()
  duration!: number;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  propertyId?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
