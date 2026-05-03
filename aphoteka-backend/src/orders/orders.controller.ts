import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignWarehouseDto } from './dto/assign-warehouse.dto';
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
        'გადახდის სიმულაცია შესრულდა (BOG completed). Balance გაგზავნა ხდება მხოლოდ ადმინის სტატუსის ცვლილებაზე.',
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
}
