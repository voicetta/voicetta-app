import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  propertyId!: string;

  @Column()
  roomTypeId!: string;

  @Column()
  guestName!: string;

  @Column()
  guestEmail!: string;

  @Column()
  checkInDate!: Date;

  @Column()
  checkOutDate!: Date;

  @Column()
  adults!: number;

  @Column({ nullable: true })
  children?: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice!: number;

  @Column()
  currency!: string;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' })
  status!: 'pending' | 'confirmed' | 'cancelled';

  @Column({ nullable: true })
  externalReservationId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  yieldPlanetReservationId?: string;

  @Column({ nullable: true, default: 'web' })
  source: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
