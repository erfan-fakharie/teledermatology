ALTER TABLE "Case" ADD COLUMN "packageId" TEXT;
CREATE INDEX "Case_patientId_packageId_idx" ON "Case"("patientId", "packageId");
