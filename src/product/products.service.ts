import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { FilterProductsDto } from './product.filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
  ) {}

  async getAllProducts() {
    return this.productsRepo.find();
  }

  async filterProducts(dto: FilterProductsDto) {
    const { name, minPrice, maxPrice, startDate, endDate } = dto;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
        throw new BadRequestException('Invalid startDate or endDate');
      }
      if (s > e) {
        throw new BadRequestException('startDate cannot be after endDate');
      }
    }

    const qb = this.productsRepo.createQueryBuilder('p');

    if (name?.trim()) {
      qb.andWhere('p.name ILIKE :name', { name: `%${name.trim()}%` });
    }

    if (minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice });
    }

    if (startDate) {
      qb.andWhere('p.dateAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('p.dateAt <= :endDate', { endDate });
    }

    return qb.orderBy('p.dateAt', 'DESC').getMany();
  }
}
