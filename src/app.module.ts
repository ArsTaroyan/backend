import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './auth/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './product/products.module';
import { Product } from './product/product.entity';
import { ChangeUserNamePasswordModule } from './change_user_name_pawwsord/change_user_name_password.module';
import { ChatModule } from './chat/chat.module';
import { Conversation } from './chat/conversation.entity';
import { Message } from './chat/message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Product, Conversation, Message],
      autoLoadEntities: true,
      synchronize: false,
    }),
    AuthModule,
    ProductsModule,
    ChangeUserNamePasswordModule,
    ChatModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
