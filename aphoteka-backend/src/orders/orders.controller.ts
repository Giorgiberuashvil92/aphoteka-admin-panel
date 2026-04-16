import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { OrderStatus } from './schemas/order.schema';
import {
  BogPaymentsService,
  type BogInitOrder,
} from '../bog/bog-payments.service';
import { BogPaymentInitDto } from '../bog/dto/bog-payment-init.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly bogPaymentsService: BogPaymentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.create(userId, dto);
  }

  /** ადმინ პანელი — JWT + მხოლოდ `admin` როლი */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOneAdmin(@Param('id') id: string) {
    return this.ordersService.findOneForAdmin(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAdmin(@Param('id') id: string, @Body() body: { status: OrderStatus }) {
    return this.ordersService.updateForAdmin(id, body.status);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMyOrders(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.findOne(id, userId);
  }

  /** საქართველოს ბანკის გადახდის გვერდზე გადამისამართების URL */
  @Post(':id/payment/bog')
  @UseGuards(JwtAuthGuard)
  async initBogPayment(
    @Param('id') id: string,
    @Body() dto: BogPaymentInitDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const order = await this.ordersService.findOne(id, userId);
    return this.bogPaymentsService.initPaymentForOrder(
      order as BogInitOrder,
      dto,
    );
  }
}
