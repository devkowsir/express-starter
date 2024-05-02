export type AccessTokenPayload = {
  id: number;
  name: string;
  email: string;
  image: string | null;
};

export type RefreshTokenPayload = {
  id: number;
};
