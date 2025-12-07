
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../infrastructure/database';
import { z } from 'zod';

const router = Router();

// Validation schemas
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    companyName: z.string().min(2),
});

// LOGIN
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                companyId: user.companyId,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company.name,
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// REGISTER (Initial Admin)
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password, companyName } = registerSchema.parse(req.body);

        // Check existing
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Company & User Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Company
            // Basic code generation: first 3 letters uppercase + random number
            const code = companyName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);

            const company = await tx.company.create({
                data: {
                    name: companyName,
                    code: code, // In real app, ensure uniqueness
                }
            });

            // Create Admin User
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'ADMIN',
                    companyId: company.id,
                }
            });

            return { company, user };
        });

        res.status(201).json({
            message: 'Registration successful',
            company: result.company.name,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
