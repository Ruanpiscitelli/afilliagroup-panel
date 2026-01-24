import { Router } from 'express';
import { Status, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
const router = Router();
// Login
router.post('/login', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        // Block PENDING users
        if (user.status === Status.PENDING) {
            return res.status(403).json({
                error: 'Conta em análise',
                message: 'Sua conta ainda está sendo analisada. Aguarde a aprovação.'
            });
        }
        // Block BANNED users
        if (user.status === Status.BANNED) {
            return res.status(403).json({
                error: 'Conta suspensa',
                message: 'Sua conta foi suspensa. Entre em contato com o suporte.'
            });
        }
        // Block REJECTED users
        if (user.status === Status.REJECTED) {
            return res.status(403).json({
                error: 'Conta rejeitada',
                message: 'Sua solicitação de cadastro foi rejeitada.'
            });
        }
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax', // Use 'none' for subdomain support on public suffixes
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// Register (public)
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    projectedFtds: z.enum(['0-50', '51-100', '101-500', '500+']).optional(),
});
router.post('/register', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const body = registerSchema.parse(req.body);
        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email: body.email },
        });
        if (existing) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        const passwordHash = await bcrypt.hash(body.password, 10);
        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                passwordHash,
                role: Role.AFFILIATE,
                status: Status.PENDING, // New registrations are PENDING
                whatsapp: body.whatsapp,
                instagram: body.instagram,
                projectedFtds: body.projectedFtds,
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
            },
        });
        return res.status(201).json({
            message: 'Cadastro realizado com sucesso! Aguarde a aprovação.',
            user,
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// Logout
router.post('/logout', (_req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    });
    return res.json({ message: 'Logout realizado com sucesso' });
});
// Get current user
router.get('/me', async (req, res) => {
    const prisma = req.app.get('prisma');
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarUrl: true,
                children: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                }
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        // Attach user to request for middleware usage
        req.user = user;
        return res.json({ user });
    }
    catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
});
export default router;
