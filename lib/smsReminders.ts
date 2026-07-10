import { prisma } from "./prisma";
import { sendReminderSms } from "./smsService";
import { getSmsTemplates } from "./smsTemplates";

type ReminderTrackingData = {
  [key: number]: string; // daysBefore: timestamp ISO string
};

/**
 * Send SMS reminders for evaluations based on configured schedule
 * This function checks all active evaluation cycles and sends reminders
 * to reviewers who haven't completed their evaluations
 */
export async function sendEvaluationReminders(daysBeforeArray?: number[]) {
  try {
    const now = new Date();

    // Get school configs with reminder schedules
    const configs = await prisma.adminConfig.findMany({
      select: {
        schoolId: true,
        reminderScheduleDaysBefore: true,
      },
    });

    console.log(`📬 Processing SMS reminders for ${configs.length} schools...`);

    let totalReminders = 0;
    let totalErrors = 0;

    for (const config of configs) {
      const daysToCheck = daysBeforeArray || config.reminderScheduleDaysBefore || [3, 1];
      const templates = await getSmsTemplates(config.schoolId);

      // Get active evaluation cycles for this school
      const cycles = await prisma.evaluationCycle.findMany({
        where: {
          schoolId: config.schoolId,
          status: "IN_PROGRESS",
          deadline: {
            gt: now, // Only future deadlines
          },
        },
        select: {
          id: true,
          deadline: true,
          remindersSentAt: true,
          subject: {
            select: {
              name: true,
            },
          },
          school: {
            select: {
              name: true,
            },
          },
          reviewers: {
            where: {
              status: "PENDING", // Only pending reviews
            },
            select: {
              id: true,
              inviteToken: true,
              type: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
              contact: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      for (const cycle of cycles) {
        const reminderTracker = (cycle.remindersSentAt as ReminderTrackingData) || {};
        const timeUntilDeadline = cycle.deadline.getTime() - now.getTime();
        const daysUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60 * 24));

        for (const daysBefore of daysToCheck) {
          // Check if reminder should be sent
          if (daysUntilDeadline === daysBefore && !reminderTracker[daysBefore]) {
            console.log(
              `\n📤 Sending ${daysBefore}-day reminders for cycle ${cycle.id.slice(0, 8)}...`
            );

            // Send SMS to all pending reviewers
            for (const reviewer of cycle.reviewers) {
              const name = reviewer.user?.name || reviewer.contact?.name || "Evaluator";
              const phone = reviewer.user?.phone || reviewer.contact?.phone;

              if (!phone?.trim()) {
                console.log(`  ⊘ No phone for ${name}, skipping SMS`);
                continue;
              }

              try {
                const result = await sendReminderSms(
                  phone,
                  name,
                  daysBefore,
                  cycle.school?.name || "Your School",
                  cycle.subject?.name || "staff member",
                  templates.reminder
                );

                if (result.ok) {
                  console.log(`  ✓ SMS sent to ${name}`);
                  totalReminders++;
                } else {
                  console.warn(`  ✗ Failed to send SMS to ${name}: ${result.error}`);
                  totalErrors++;
                }
              } catch (error) {
                console.error(
                  `  ✗ Error sending SMS to ${name}:`,
                  error instanceof Error ? error.message : error
                );
                totalErrors++;
              }
            }

            // Update tracking - mark this reminder as sent
            reminderTracker[daysBefore] = new Date().toISOString();
            await prisma.evaluationCycle.update({
              where: { id: cycle.id },
              data: {
                remindersSentAt: reminderTracker,
              },
            });

            console.log(`  Updated cycle tracking for ${daysBefore}-day reminder`);
          }
        }
      }
    }

    console.log(`\n✅ Reminder processing complete`);
    console.log(`   Sent: ${totalReminders}, Errors: ${totalErrors}`);
    return { sent: totalReminders, errors: totalErrors };
  } catch (error) {
    console.error("Error processing reminders:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get summary of upcoming reminders that need to be sent
 */
export async function getReminderSummary() {
  const now = new Date();

  const cycles = await prisma.evaluationCycle.findMany({
    where: {
      status: "IN_PROGRESS",
      deadline: {
        gt: now,
      },
    },
    select: {
      id: true,
      deadline: true,
      remindersSentAt: true,
      reviewers: {
        where: {
          status: "PENDING",
        },
        select: {
          id: true,
          user: {
            select: {
              phone: true,
            },
          },
          contact: {
            select: {
              phone: true,
            },
          },
        },
      },
      school: {
        select: {
          name: true,
          adminConfigs: {
            select: {
              reminderScheduleDaysBefore: true,
            },
          },
        },
      },
    },
  });

  const summary = cycles.map((cycle) => {
    const timeUntilDeadline = cycle.deadline.getTime() - now.getTime();
    const daysUntilDeadline = Math.ceil(
      timeUntilDeadline / (1000 * 60 * 60 * 24)
    );
    const reminderTracker =
      (cycle.remindersSentAt as ReminderTrackingData) || {};

    const pendingReviewersWithPhone = cycle.reviewers.filter(
      (r) => r.user?.phone || r.contact?.phone
    ).length;
    const config = cycle.school.adminConfigs[0];
    const configuredDays = config?.reminderScheduleDaysBefore || [3, 1];

    return {
      cycleId: cycle.id,
      school: cycle.school.name,
      daysUntilDeadline,
      pendingReviewersWithPhone,
      configuredReminders: configuredDays,
      sentReminders: Object.keys(reminderTracker).map(Number),
    };
  });

  return summary;
}
