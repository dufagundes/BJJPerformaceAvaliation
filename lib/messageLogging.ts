import { prisma } from "./prisma";

export async function logSmsMessage(data: {
  schoolId: string;
  cycleId?: string;
  reviewerId?: string;
  twilioSid: string;
  toPhone: string;
  fromPhone: string;
  messageBody: string;
  messageType: string; // "invite", "reminder", "confirmation"
  status?: string;
}) {
  try {
    return await prisma.smsMessage.create({
      data: {
        schoolId: data.schoolId,
        cycleId: data.cycleId,
        reviewerId: data.reviewerId,
        twilioSid: data.twilioSid,
        toPhone: data.toPhone,
        fromPhone: data.fromPhone,
        messageBody: data.messageBody,
        messageType: data.messageType,
        status: data.status || "sent",
      },
    });
  } catch (error) {
    console.error("Error logging SMS message:", error);
    // Don't throw - logging failure shouldn't break SMS sending
  }
}

export async function logSmsReply(data: {
  schoolId: string;
  twilioSid: string;
  originalSid: string;
  replyFromPhone: string;
  replyToPhone: string;
  messageBody: string;
}) {
  try {
    return await prisma.smsReply.create({
      data,
    });
  } catch (error) {
    console.error("Error logging SMS reply:", error);
  }
}

export async function logEmailMessage(data: {
  schoolId: string;
  cycleId?: string;
  reviewerId?: string;
  resendId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  htmlContent: string;
  messageType: string; // "invite", "reminder", "confirmation"
  status?: string;
}) {
  try {
    return await prisma.emailMessage.create({
      data: {
        schoolId: data.schoolId,
        cycleId: data.cycleId,
        reviewerId: data.reviewerId,
        resendId: data.resendId,
        toEmail: data.toEmail,
        fromEmail: data.fromEmail,
        subject: data.subject,
        htmlContent: data.htmlContent,
        messageType: data.messageType,
        status: data.status || "sent",
      },
    });
  } catch (error) {
    console.error("Error logging email message:", error);
  }
}

export async function updateSmsStatus(twilioSid: string, status: string, deliveredAt?: Date) {
  try {
    return await prisma.smsMessage.update({
      where: { twilioSid },
      data: {
        status,
        deliveredAt: deliveredAt || (status === "delivered" ? new Date() : undefined),
      },
    });
  } catch (error) {
    console.error("Error updating SMS status:", error);
  }
}

export async function getSmsHistory(schoolId: string, options?: {
  cycleId?: string;
  reviewerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = { schoolId };

  if (options?.cycleId) where.cycleId = options.cycleId;
  if (options?.reviewerId) where.reviewerId = options.reviewerId;
  if (options?.status) where.status = options.status;

  return await prisma.smsMessage.findMany({
    where,
    include: {
      cycle: { select: { id: true, description: true } },
      reviewer: { select: { id: true, inviteToken: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function getEmailHistory(schoolId: string, options?: {
  cycleId?: string;
  reviewerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = { schoolId };

  if (options?.cycleId) where.cycleId = options.cycleId;
  if (options?.reviewerId) where.reviewerId = options.reviewerId;
  if (options?.status) where.status = options.status;

  return await prisma.emailMessage.findMany({
    where,
    include: {
      cycle: { select: { id: true, description: true } },
      reviewer: { select: { id: true, inviteToken: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function getSmsReplies(schoolId: string, originalSid?: string) {
  const where: any = { schoolId };
  if (originalSid) where.originalSid = originalSid;

  return await prisma.smsReply.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
