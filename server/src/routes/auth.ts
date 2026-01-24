import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
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

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token');
    return res.json({ message: 'Logout realizado com sucesso' });
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
    const prisma = req.app.get('prisma') as PrismaClient;
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        return res.json({ user });
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
});

export default router;
