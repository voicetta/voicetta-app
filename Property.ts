import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  yieldPlanetPropertyId!: string;

  @Column()
  clientId!: string;

  @Column({ type: 'jsonb', nullable: true })
  yieldPlanetConfig?: {
    credentials?: {
      username?: string;
      apiKey?: string;
    };
    mappings?: {
      roomTypes?: Record<string, string>;
      rateTypes?: Record<string, string>;
    };
  };

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  address!: string;

  @Column()
  city!: string;

  @Column()
  country!: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  amenities?: string[];

  @Column({ type: 'jsonb' })
  roomTypes!: {
    id: string;
    name: string;
    maxOccupancy: number;
    description?: string;
    amenities?: string[];
    images?: string[];
    basePrice: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    cancellationPolicy?: string;
    otherPolicies?: Record<string, string>;
  };

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
