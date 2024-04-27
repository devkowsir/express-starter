import { z } from "zod";

const tokenData = z.object({
  provider: z.literal("oauth/google"),
  token: z.string(),
});

const credentialData = z.object({
  provider: z.literal("credential"),
  name: z.string().max(64),
  email: z.string().email().max(64),
  password: z.string().min(6).max(128),
});

const signUpValidator = z.discriminatedUnion("provider", [tokenData, credentialData]);

const signInValidator = z.discriminatedUnion("provider", [tokenData, credentialData.omit({ name: true })]);

type SignUpData = z.infer<typeof signUpValidator>;
type SignInData = z.infer<typeof signInValidator>;

export { signUpValidator, signInValidator, SignUpData, SignInData };
