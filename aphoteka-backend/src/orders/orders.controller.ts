import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignWarehouseDto } from './dto/assign-warehouse.dto';
import {
  DeliveryRedispatchApplyDto,
  DeliveryRedispatchPreviewDto,
} from './dto/delivery-redispatch.dto';
import { UpdateDeliveryAddressDto } from './dto/update-delivery-address.dto';
import { UpdateWarehouseOrderStatusDto } from './dto/update-warehouse-order-status.dto';
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
  private readonly logger = new Logger(OrdersController.name);

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

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Get('admin/by-warehouse/:warehouseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdminByWarehouse(@Param('warehouseId') warehouseId: string) {
    return this.ordersService.findAllForAdminByWarehouse(warehouseId);
  }

  @Patch('admin/:id/assign-warehouse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  assignWarehouseAdmin(
    @Param('id') id: string,
    @Body() dto: AssignWarehouseDto,
  ) {
    return this.ordersService.assignWarehouseForAdmin(id, dto.warehouseId);
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

  @Post('admin/:id/send-to-quickshipper')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendToQuickshipper(@Param('id') id: string) {
    await this.ordersService.sendToQuickshipper(id);
    return {
      ok: true,
      message: 'შეკვეთა წარმატებით გაიგზავნა Quickshipper-ზე',
    };
  }

  @Post('admin/:id/delivery-redispatch/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  previewDeliveryRedispatch(
    @Param('id') id: string,
    @Body() dto: DeliveryRedispatchPreviewDto,
  ) {
    return this.ordersService.previewDeliveryRedispatch(id, dto.warehouseId);
  }

  @Post('admin/:id/delivery-redispatch/apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  applyDeliveryRedispatch(
    @Param('id') id: string,
    @Body() dto: DeliveryRedispatchApplyDto,
  ) {
    return this.ordersService.applyDeliveryRedispatch(id, dto);
  }

  @Post('admin/:id/delivery-redispatch/mark-paid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  markDeliveryRedispatchPaid(@Param('id') id: string) {
    return this.ordersService.markDeliveryRedispatchPaid(id);
  }

  @Get('admin/:id/payment/bog/refund-preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  previewBogProductsRefund(@Param('id') id: string) {
    return this.ordersService.previewProductsRefundForAdmin(id);
  }

  @Post('admin/:id/payment/bog/refund-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  refundBogProducts(@Param('id') id: string) {
    return this.ordersService.refundProductsForAdmin(id);
  }

  @Post('admin/:id/payment/bog/refund-full')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  refundBogFull(@Param('id') id: string) {
    return this.ordersService.refundFullForAdmin(id);
  }

  @Post('admin/:id/balance/retry-refund-credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  retryRefundBalanceCredit(@Param('id') id: string) {
    this.logger.warn(
      `[HTTP] POST /orders/admin/${id}/balance/retry-refund-credit`,
    );
    return this.ordersService.retryRefundBalanceCreditForAdmin(id);
  }

  @Post('admin/:id/balance/retry-sale')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  retryBalanceSale(@Param('id') id: string) {
    return this.ordersService.retryBalanceSaleForAdmin(id);
  }

  @Post('admin/:id/balance/retry-warehouse-credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  retryWarehouseCredit(@Param('id') id: string) {
    return this.ordersService.retryWarehouseCreditForAdmin(id);
  }

  @Post('admin/:id/balance/retry-delivery-sale')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  retryDeliveryBalanceSale(@Param('id') id: string) {
    return this.ordersService.retryDeliveryBalanceSaleForAdmin(id);
  }

  @Post('admin/:id/delivery-address/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  previewDeliveryAddressUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryAddressDto,
  ) {
    return this.ordersService.previewDeliveryAddressUpdate(id, dto);
  }

  @Patch('admin/:id/delivery-address')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  applyDeliveryAddressUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryAddressDto,
  ) {
    return this.ordersService.applyDeliveryAddressUpdate(id, dto);
  }

  /** საწყობის თანამშრომლის შეკვეთების სია (`warehouse/:id`-ს არ ეჯახება) */
  @Get('assigned-to-me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WAREHOUSE_STAFF)
  findMyWarehouseOrders(@Request() req: any) {
    const wh = req.user?.warehouseId;
    const wid =
      wh && typeof wh === 'object' && '_id' in wh
        ? String(wh._id)
        : wh != null
          ? String(wh)
          : '';
    if (!wid || wid === 'undefined') {
      throw new ForbiddenException(
        'საწყობი არ არის მიბმული პროფილზე — დაუკავშირდით ადმინისტრატორს',
      );
    }
    return this.ordersService.findAllForWarehouse(wid);
  }

  @Get('warehouse/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WAREHOUSE_STAFF)
  findOneWarehouseOrder(@Param('id') id: string, @Request() req: any) {
    const wh = req.user?.warehouseId;
    const wid =
      wh && typeof wh === 'object' && '_id' in wh
        ? String(wh._id)
        : wh != null
          ? String(wh)
          : '';
    if (!wid || wid === 'undefined') {
      throw new ForbiddenException(
        'საწყობი არ არის მიბმული პროფილზე — დაუკავშირდით ადმინისტრატორს',
      );
    }
    return this.ordersService.findOneForWarehouseStaff(id, wid);
  }

  @Patch('warehouse/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WAREHOUSE_STAFF)
  updateWarehouseOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseOrderStatusDto,
    @Request() req: any,
  ) {
    const wh = req.user?.warehouseId;
    const wid =
      wh && typeof wh === 'object' && '_id' in wh
        ? String(wh._id)
        : wh != null
          ? String(wh)
          : '';
    if (!wid || wid === 'undefined') {
      throw new ForbiddenException(
        'საწყობი არ არის მიბმული პროფილზე — დაუკავშირდით ადმინისტრატორს',
      );
    }
    return this.ordersService.updateStatusForWarehouse(id, wid, dto.status);
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

  @Post(':id/payment/bog/ensure-balance-sale')
  @UseGuards(JwtAuthGuard)
  async ensureBalanceSale(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.ensureBalanceSalePostedForUser(id, userId);
  }

  @Post(':id/payment/bog/dev-simulate-completed')
  @UseGuards(JwtAuthGuard)
  async devSimulateBogCompleted(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const data = await this.ordersService.simulateBogCompletedForUser(
      id,
      userId,
    );
    return {
      ok: true,
      message:
        'გადახდის სიმულაცია შესრულდა — Balance Sale PUT გაეშვა (ან უკვე იყო ჩაწერილი).',
      data,
    };
  }

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

  @Post(':id/payment/bog/delivery-redispatch')
  @UseGuards(JwtAuthGuard)
  async initDeliveryRedispatchBogPayment(
    @Param('id') id: string,
    @Body() dto: BogPaymentInitDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const order = await this.ordersService.findOne(id, userId);
    return this.bogPaymentsService.initPaymentForDeliveryRedispatch(
      order as BogInitOrder,
      dto,
    );
  }

  @Post(':id/payment/bog/delivery-redispatch/ensure-paid')
  @UseGuards(JwtAuthGuard)
  async ensureDeliveryRedispatchPaid(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.ensureDeliveryRedispatchPaidForUser(id, userId);
  }
}
