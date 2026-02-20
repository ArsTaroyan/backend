import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  image: string

  @Column()
  description: string

  @Column({
    nullable:true
  })
  dateAt: Date

  @Column({
    nullable: true
  })
  price: number
}
