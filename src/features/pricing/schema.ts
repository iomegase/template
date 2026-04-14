import { z } from "zod";

import { PaymentMode } from "@/generated/prisma/enums";

const moneyAmountSchema = z.coerce.number().finite().nonnegative();

export const bookingPricingSnapshotSchema = z.object({
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  roomBasePrice: moneyAmountSchema,
  companionSurcharge: moneyAmountSchema,
  totalAmount: moneyAmountSchema,
  firstInstallmentAmount: moneyAmountSchema,
  secondInstallmentAmount: moneyAmountSchema,
  amountPaid: moneyAmountSchema,
  amountRemaining: moneyAmountSchema,
});

export const bookingInstallmentPlanSchema = z
  .object({
    paymentMode: z.nativeEnum(PaymentMode),
    dueNow: moneyAmountSchema,
    dueLater: moneyAmountSchema,
    secondInstallmentDueDate: z.coerce.date().nullable(),
  })
  .superRefine((values, context) => {
    if (values.paymentMode === PaymentMode.full) {
      if (values.dueLater !== 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueLater"],
          message: "Full payment cannot have a later due amount.",
        });
      }
    }

    if (
      values.paymentMode === PaymentMode.split_2x &&
      values.secondInstallmentDueDate === null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondInstallmentDueDate"],
        message: "Split payments require a due date for the second installment.",
      });
    }
  });
