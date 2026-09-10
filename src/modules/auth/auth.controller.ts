import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class AuthController {
  static sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.sendOtp(req.body.phone);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'OTP sent successfully'));
  });

  static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.verifyOtpAndLogin(req.body);
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        result,
        result.isNewUser ? 'Account registered & logged in successfully' : 'Logged in successfully'
      )
    );
  });

  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.registerWithPassword(req.body);
    res.status(HTTP_STATUS.CREATED).json(
      new ApiResponse(HTTP_STATUS.CREATED, result, 'Account registered successfully')
    );
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    const result = await AuthService.loginWithPassword(identifier, password);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Logged in successfully'));
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Tokens refreshed successfully'));
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await AuthService.logout(req.user.userId);
    }
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Logged out successfully'));
  });
}
