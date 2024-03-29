import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AwsS3Service } from 'src/shared/aws-s3/aws-s3.service';
import { CreatePaymentDto } from '../../domain/dto/create-payment-dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CreatePaymentUsecase {
  constructor(
    @Inject(REQUEST) private request: Request,
    private awsS3Service: AwsS3Service,
    private prismaService: PrismaService,
  ) {}

  async handle(
    adminId: string,
    body: CreatePaymentDto,
    files: Express.Multer.File[],
  ) {
    const receiptUrls = [];

    //* Convertimos las fechas
    body.startDate = new Date(body.startDate);
    body.endDate = new Date(body.endDate);
    body.endDate.setHours(10);

    //* 1. Buscamos que exista el cliente
    const foundClient = await this.prismaService.client.findFirst({
      where: {
        id: body.clientId,
      },
    });

    //* 1.1. Si no existe lanzamos un error
    if (!foundClient)
      throw new NotFoundException(
        'No existe el cliente al que se le intenta registrar el pago',
      );

    //* 2. Obtenemos los valores base para la creacion posterior del pago
    const months = this.getMonthDifference(body.startDate, body.endDate);
    const paymentPerMonth = body.amount / months;

    //* 3. Establecemos valor para saber si el dia establecido es ultimo dia del mes
    const toCreateSubPayments: {
      amount: number;
      endDate: Date;
      startDate: Date;
    }[] = [];

    //* 3.1. Verificamos si es el ultimo dia del mes
    const isLastDayApply =
      this.isLastDayOfMonth(body.startDate) ||
      this.isLastDayOfMonth(body.endDate);

    //* 3.2. Vamos seteando los valores de dia inicial y dia final para cada mes
    for (let i = 0; i < months; i++) {
      let startDate =
        i == 0 ? body.startDate : this.sumMonth(body.startDate, i);

      let endDate =
        i == months - 1 ? body.endDate : this.sumMonth(body.startDate, i + 1);

      if (isLastDayApply) {
        startDate = i == 0 ? body.startDate : this.getLastDayOfMonth(startDate);
        endDate =
          i == months - 1 ? body.endDate : this.getLastDayOfMonth(endDate);
      }

      toCreateSubPayments.push({
        amount: paymentPerMonth,
        startDate,
        endDate,
      });
    }

    //* 4. Subimos los archivos
    if (files) {
      const promiseToUploadFiles = files.map((fileItem) =>
        this.awsS3Service.uploadFile(fileItem),
      );

      const uploadedFiles = await Promise.all(promiseToUploadFiles);

      uploadedFiles.map((uploadFileItem) => {
        receiptUrls.push(uploadFileItem.file_url);
      });
    }

    //* 5. Creamos el pago
    const createdPayment = await this.prismaService.payment.create({
      data: {
        clientId: body.clientId,
        creatorAdminId: adminId,
        details: body.details || null,
        SubPayments: {
          createMany: {
            data: [...toCreateSubPayments],
          },
        },
        Receipts: {
          createMany: {
            data: [
              ...receiptUrls.map((t) => ({
                fileUrl: t,
              })),
            ],
          },
        },
      },
    });

    return createdPayment;
  }

  private getMonthDifference(startDate: Date, endDate: Date) {
    const copiedStartDate = new Date(startDate.getTime());
    const copiedEndDate = new Date(endDate.getTime());

    return (
      copiedEndDate.getMonth() -
      copiedStartDate.getMonth() +
      12 * (copiedEndDate.getFullYear() - copiedStartDate.getFullYear())
    );
  }

  private getLastDayOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  private isLastDayOfMonth(day: Date) {
    const clonedDay = new Date(day.getTime());
    const month = clonedDay.getMonth();

    clonedDay.setDate(clonedDay.getDate() + 1);
    return clonedDay.getMonth() !== month;
  }

  private sumMonth(date: Date, monthToSum: number) {
    const copiedDate = new Date(date.getTime());
    const newDate = new Date(
      copiedDate.setMonth(copiedDate.getMonth() + monthToSum),
    );
    return newDate;
  }
}
