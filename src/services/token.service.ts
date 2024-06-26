import { REFRESH_TOKEN_AGE } from "@/config";
import _redis from "@/databases/redis";

export default class TokenService {
  private redis = _redis;

  public async revokeRefreshToken(token: string) {
    return await this.redis.setex(`revoked-token#${token}`, REFRESH_TOKEN_AGE, true);
  }

  public async isRefreshTokenRevoked(token: string) {
    return !!(await this.redis.get(`revoked-token#${token}`));
  }
}
