import { addDaysIsoUtc } from '../lib/time.js';
export function buildDefaultReminderSchedule(args) {
    return {
        invoiceId: args.invoiceId,
        reminders: [
            { kind: 'issue_immediately', at: args.issuedAt },
            { kind: 'before_due_3d', at: addDaysIsoUtc(args.dueAt, -3) },
            { kind: 'on_due', at: args.dueAt },
            { kind: 'after_due_3d', at: addDaysIsoUtc(args.dueAt, 3) },
            { kind: 'after_due_7d', at: addDaysIsoUtc(args.dueAt, 7) }
        ]
    };
}
