export type AccessTokenPayload = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type RefreshTokenPayload = {
  id: string;
};
