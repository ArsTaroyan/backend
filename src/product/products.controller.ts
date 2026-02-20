import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common'
import { ProductsService } from './products.service'
import { FilterProductsDto } from './product.filter.dto'

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('all')
  getMyProducts() {
    return this.productsService.getAllProducts()
  }

  @Get('filter')
  filterProduct(@Query() query: FilterProductsDto) {
    return this.productsService.filterProducts(query)
  }
}