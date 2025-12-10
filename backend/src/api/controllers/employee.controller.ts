import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/employees
router.get('/', async (req: Request, res: Response) => {
      try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;

            const skip = (page - 1) * limit;

            const where: any = { isActive: true };

            if (search) {
                  where.OR = [
                        { fullName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { mobilePhone: { contains: search, mode: 'insensitive' } },
                  ];
            }

            const total = await prisma.employee.count({ where });
            const employees = await prisma.employee.findMany({
                  where,
                  skip,
                  take: limit,
                  orderBy: { fullName: 'asc' },
                  include: {
                        salesperson: true
                  }
            });

            res.json({
                  data: employees,
                  meta: {
                        total,
                        page,
                        limit,
                        last_page: Math.ceil(total / limit)
                  }
            });
      } catch (error) {
            console.error('Error fetching employees:', error);
            res.status(500).json({ error: 'Failed to fetch employees' });
      }
});

// POST /api/employees
router.post('/', async (req: Request, res: Response) => {
      try {
            const {
                  fullName, salutation, position, email, mobilePhone,
                  businessPhone, homePhone, whatsapp, website, citizenship,
                  employeeIdType, idCardNumber, joinDate, branch, notes,
                  isSalesperson,
                  // Salesperson specific
                  salespersonCode
            } = req.body;

            if (!fullName) {
                  return res.status(400).json({ error: 'Nama Lengkap wajib diisi' });
            }

            const defaultCompany = await prisma.company.findFirst();
            if (!defaultCompany) {
                  return res.status(500).json({ error: 'No company found' });
            }

            // Transaction to handle both Employee and Salesperson creation
            const result = await prisma.$transaction(async (tx) => {
                  // 1. Create Employee
                  const employee = await tx.employee.create({
                        data: {
                              companyId: defaultCompany.id,
                              fullName,
                              salutation,
                              position,
                              email,
                              mobilePhone,
                              businessPhone,
                              homePhone,
                              whatsapp,
                              website,
                              citizenship,
                              employeeIdType,
                              idCardNumber,
                              joinDate: joinDate ? new Date(joinDate) : undefined,
                              branch,
                              notes
                        }
                  });

                  // 2. If isSalesperson, create Salesperson linked to Employee
                  if (isSalesperson) {
                        // Generate code if not provided (simple logic for now)
                        const code = salespersonCode || `SP-${employee.id.substring(0, 8).toUpperCase()}`;

                        // Check for duplicate code
                        const existingSp = await tx.salesperson.findFirst({
                              where: { companyId: defaultCompany.id, code }
                        });
                        if (existingSp) {
                              throw new Error(`Kode Penjual ${code} sudah ada`);
                        }

                        await tx.salesperson.create({
                              data: {
                                    companyId: defaultCompany.id,
                                    code,
                                    name: fullName,
                                    phone: mobilePhone,
                                    email: email,
                                    employeeId: employee.id
                              }
                        });
                  }

                  return employee;
            });

            res.status(201).json({ data: result, message: 'Karyawan berhasil dibuat' });
      } catch (error: any) {
            console.error('Error creating employee:', error);
            // Log the full error object for debugging
            console.error(JSON.stringify(error, null, 2));
            res.status(500).json({ error: error.message || 'Gagal membuat karyawan', details: error });
      }
});

// PUT /api/employees/:id
router.put('/:id', async (req: Request, res: Response) => {
      try {
            const { id } = req.params;
            const {
                  fullName, salutation, position, email, mobilePhone,
                  businessPhone, homePhone, whatsapp, website, citizenship,
                  employeeIdType, idCardNumber, joinDate, branch, notes,
                  isSalesperson,
                  salespersonCode
            } = req.body;

            const defaultCompany = await prisma.company.findFirst();
            if (!defaultCompany) return res.status(500).json({ error: 'No company found' });

            const result = await prisma.$transaction(async (tx) => {
                  // 1. Update Employee
                  const employee = await tx.employee.update({
                        where: { id },
                        data: {
                              fullName,
                              salutation,
                              position,
                              email,
                              mobilePhone,
                              businessPhone,
                              homePhone,
                              whatsapp,
                              website,
                              citizenship,
                              employeeIdType,
                              idCardNumber,
                              joinDate: joinDate ? new Date(joinDate) : undefined,
                              branch,
                              notes
                        }
                  });

                  // 2. Handle Salesperson Sync
                  const existingSalesperson = await tx.salesperson.findUnique({
                        where: { employeeId: id }
                  });

                  if (isSalesperson) {
                        if (existingSalesperson) {
                              // Update existing
                              await tx.salesperson.update({
                                    where: { id: existingSalesperson.id },
                                    data: {
                                          name: fullName,
                                          phone: mobilePhone,
                                          email: email
                                    }
                              });
                        } else {
                              // Create new
                              const code = salespersonCode || `SP-${employee.id.substring(0, 8).toUpperCase()}`;
                              const existingSpCode = await tx.salesperson.findFirst({
                                    where: { companyId: defaultCompany.id, code }
                              });
                              if (existingSpCode) throw new Error(`Kode Penjual ${code} sudah ada`);

                              await tx.salesperson.create({
                                    data: {
                                          companyId: defaultCompany.id,
                                          code,
                                          name: fullName,
                                          phone: mobilePhone,
                                          email: email,
                                          employeeId: employee.id
                                    }
                              });
                        }
                  } else {
                        // If isSalesperson is false, but one exists, delete it? 
                        // Or just de-activate? User said "jika data salesperson di hapus di table Karyawan Maka data di salesPerson akan terhapus"
                        // But here we are just unticking the box. Let's delete it to be consistent with "sync".
                        if (existingSalesperson) {
                              await tx.salesperson.delete({
                                    where: { id: existingSalesperson.id }
                              });
                        }
                  }

                  return employee;
            });

            res.json({ data: result, message: 'Karyawan berhasil diperbarui' });
      } catch (error: any) {
            console.error('Error updating employee:', error);
            res.status(500).json({ error: error.message || 'Gagal memperbarui karyawan' });
      }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req: Request, res: Response) => {
      try {
            const { id } = req.params;
            // Salesperson will be deleted automatically due to onDelete: Cascade in schema
            await prisma.employee.delete({
                  where: { id }
            });
            res.json({ message: 'Karyawan berhasil dihapus' });
      } catch (error) {
            console.error('Error deleting employee:', error);
            res.status(500).json({ error: 'Gagal menghapus karyawan' });
      }
});

export default router;
