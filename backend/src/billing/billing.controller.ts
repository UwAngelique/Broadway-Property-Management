import { Controller, Get } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /** Public — used on signup to show plans (no auth). */
  @Get('plans')
  plans() {
    return this.billingService.getPlans();
  }
}
