import { CanActivate, Controller, ExecutionContext, Injectable, Post, Get, Body, Req, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
export type AuthRequest = Request & { owner: string; token: string };
@Injectable()
export class AuthService implements CanActivate {
  client() {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  }
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('AUTH_REQUIRED');
    try {
      const { data, error } = await this.client().auth.getUser(match[1]);
      if (error || !data.user) throw new UnauthorizedException('INVALID_SESSION');
      req.owner = data.user.id; req.token = match[1]; return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException('AUTH_UNAVAILABLE');
    }
  }
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') async login(@Body() body: Record<string, unknown>) {
    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') throw new UnauthorizedException('INVALID_CREDENTIALS');
    const { data, error } = await this.auth.client().auth.signInWithPassword({ email: body.email, password: body.password });
    if (error) throw new UnauthorizedException('INVALID_CREDENTIALS');
    return { success: true, data };
  }
  @Post('refresh') async refresh(@Body() body: Record<string, unknown>) {
    if (typeof body?.refresh_token !== 'string') throw new UnauthorizedException('INVALID_SESSION');
    const { data, error } = await this.auth.client().auth.refreshSession({ refresh_token: body.refresh_token });
    if (error) throw new UnauthorizedException('INVALID_SESSION');
    return { success: true, data };
  }
  @Get('session') async session(@Req() req: AuthRequest) {
    await this.verify(req); return { success: true, data: { user: { id: req.owner } } };
  }
  @Post('logout') async logout(@Req() req: AuthRequest) {
    await this.verify(req);
    // Supabase Auth logout revokes refresh tokens. Access JWT lifetime remains provider-defined.
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/logout?scope=global`, { method: 'POST', headers: { apikey: process.env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${req.token}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new ServiceUnavailableException('LOGOUT_FAILED');
    return { success: true };
  }
  private async verify(req: AuthRequest) {
    await this.auth.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as ExecutionContext);
  }
}
