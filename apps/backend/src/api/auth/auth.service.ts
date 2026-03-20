import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StudentRepository } from '../../infrastructure/orm/repositories/student.repository';
import { RegisterDto, LoginDto } from './auth.request.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.studentRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const student = await this.studentRepository.createStudent({
      email: dto.email,
      password: hashed,
    });

    const token = this.signToken(student.id, student.email);
    return { token, student };
  }

  async login(dto: LoginDto) {
    const student = await this.studentRepository.findByEmail(dto.email);
    if (!student) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, student.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken(student.id, student.email);
    return { token, student };
  }

  /**
   * Get the profile of a user
   */
  async getProfile(userId: string) {
    const student = await this.studentRepository.findByIdWithProfile(userId);
    if (!student) {
      throw new UnauthorizedException('User not found');
    }
    return student;
  }

  private signToken(sub: string, email: string) {
    const payload: JwtPayload = { sub, email };
    return this.jwtService.sign(payload);
  }
}
