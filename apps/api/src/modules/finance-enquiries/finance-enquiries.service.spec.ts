import { NotFoundException } from '@nestjs/common';
import { FinanceEnquiriesService } from './finance-enquiries.service';

interface CreateArgs {
  data: {
    name: string;
    phone: string;
    message?: string;
    vehicleId?: string;
  };
}

function buildService() {
  const vehicleTable = { findUnique: jest.fn() };
  const financeEnquiryTable = {
    create: jest.fn<undefined, [CreateArgs]>(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { vehicle: vehicleTable, financeEnquiry: financeEnquiryTable };
  const service = new FinanceEnquiriesService(prisma as never);
  return { service, prisma };
}

describe('FinanceEnquiriesService', () => {
  describe('create', () => {
    it('resolves a valid vehiclePublicId to the internal id', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1' });

      await service.create({
        name: 'Rahul',
        phone: '+919876543210',
        vehiclePublicId: 10006,
      });

      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { publicId: 10006 },
        select: { id: true },
      });
      const [[createArgs]] = prisma.financeEnquiry.create.mock.calls;
      expect(createArgs.data).toMatchObject({
        name: 'Rahul',
        phone: '+919876543210',
        vehicleId: 'vehicle-1',
      });
    });

    it('drops an unknown vehiclePublicId rather than failing the submission', async () => {
      const { service, prisma } = buildService();
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await service.create({
        name: 'Rahul',
        phone: '+919876543210',
        vehiclePublicId: 99999,
      });

      const [[createArgs]] = prisma.financeEnquiry.create.mock.calls;
      expect(createArgs.data.vehicleId).toBeUndefined();
    });

    it('records a generic enquiry with no vehicle context at all', async () => {
      const { service, prisma } = buildService();

      await service.create({ name: 'Rahul', phone: '+919876543210' });

      expect(prisma.vehicle.findUnique).not.toHaveBeenCalled();
      const [[createArgs]] = prisma.financeEnquiry.create.mock.calls;
      expect(createArgs.data.vehicleId).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException for an unknown enquiry id', async () => {
      const { service, prisma } = buildService();
      prisma.financeEnquiry.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('does-not-exist', 'contacted'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.financeEnquiry.update).not.toHaveBeenCalled();
    });

    it('updates the status of a real enquiry', async () => {
      const { service, prisma } = buildService();
      prisma.financeEnquiry.findUnique.mockResolvedValue({ id: 'fe-1' });
      prisma.financeEnquiry.update.mockResolvedValue({
        id: 'fe-1',
        status: 'contacted',
      });

      const result = await service.updateStatus('fe-1', 'contacted');

      expect(prisma.financeEnquiry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fe-1' },
          data: { status: 'contacted' },
        }),
      );
      expect(result).toMatchObject({ status: 'contacted' });
    });
  });
});
