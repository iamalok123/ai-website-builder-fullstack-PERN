ALTER TABLE "user" ADD COLUMN "image" TEXT;

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
