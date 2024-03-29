import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from '../../domain/dto/create-payment-dto';
import { IResponse } from 'src/core/interfaces/response.interface';
import { CreatePaymentUsecase } from '../../infrastructure/usecases/create-payment.usecase';
import { UploadReceiptUsecase } from '../../infrastructure/usecases/upload-receipt.usecase';
import { ListPaymentsUsecase } from '../../infrastructure/usecases/list-payments.usecase';
import { ListPaymentDto } from '../../domain/dto/list-payment.dto';
import { GetPaymentByIdUsecase } from '../../infrastructure/usecases/get-payment-by-id.usecase';
import { TogglePaymentValidityByIdUsecase } from '../../infrastructure/usecases/toggle-payment-validity-by-id.usecase';
import { TogglePaymentValidityDto } from '../../domain/dto/toggle-payment-validity.dto';

@Injectable()
export class PaymentService {
  constructor(
    private createPaymentUsecase: CreatePaymentUsecase,
    private uploadReceiptUsecase: UploadReceiptUsecase,
    private listPaymentsUsecase: ListPaymentsUsecase,
    private getPaymentByIdUsecase: GetPaymentByIdUsecase,
    private togglePaymentValidityByIdUsecase: TogglePaymentValidityByIdUsecase,
  ) {}

  async createPayment(
    adminId: string,
    body: CreatePaymentDto,
    files: Express.Multer.File[],
  ): Promise<IResponse<any>> {
    const data = await this.createPaymentUsecase.handle(adminId, body, files);

    return { data };
  }

  async uploadReceipt(
    paymentId: string,
    files: Express.Multer.File[],
  ): Promise<IResponse<any>> {
    const data = await this.uploadReceiptUsecase.handle(paymentId, files);

    return { data };
  }

  async listPayments(query?: ListPaymentDto): Promise<IResponse<any>> {
    const data = await this.listPaymentsUsecase.handle(query);

    return { count: data.length, data };
  }

  async getPaymentById(paymentId: string): Promise<IResponse<any>> {
    const data = await this.getPaymentByIdUsecase.handle(paymentId);

    return { data };
  }

  async togglePaymentValidityById(
    paymentId: string,
    body: TogglePaymentValidityDto,
  ): Promise<IResponse<any>> {
    const data = await this.togglePaymentValidityByIdUsecase.handle(
      paymentId,
      body,
    );

    return { data };
  }
}
